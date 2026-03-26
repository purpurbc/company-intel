from __future__ import annotations

from worker.seed.seed_company import seed_company
from worker.database import get_db_connection
from worker.scb.utils.client_config import SCBClientConfig
from worker.scb.models.variable import Variable, Operator
from worker.scb.scb_base_client import SCBClient
from worker.scb.models.company import CompanyJE
from worker.scb.models.category import SCBCategory, Category
from worker.scb.constants import SCB_MAX_ROWS_RETURNED
from worker.scb.config import PARTITIONS

import time
from typing import List
import copy
import json

def valid_operator(operator):
    # TODO: implement
    return True

class SCBCustomClient(SCBClient):
    def __init__(self, cfg: SCBClientConfig = SCBClientConfig.default()):
        super().__init__(cfg)
        
    def within_limits(self, n : int) -> bool:
        if n > SCB_MAX_ROWS_RETURNED:
            return False
        return True
        
    def get_companies_by_name(self, name : str, operator : Operator = Operator.STARTS_WITH) -> List[CompanyJE]:
        """Returns a list of companies that match the name with the given operator

        Args:
            name (str): _description_
            operator (Operator, optional): _description_. Defaults to Operator.STARTS_WITH.

        Returns:
            List[CompanyJE]: _description_
        """
        if not valid_operator(operator):
            return None
        
        res = self._post_Je_HamtaForetag(
            variables= [
                Variable(
                    variable= "Namn",
                    operator= operator,
                    val_1= name
                )
            ]
        )
        
        return [CompanyJE.from_scb(c) for c in res]
        
    def get_companies_by_orgnr(self, orgnr : str, operator : Operator = Operator.EQUAL) -> List[CompanyJE]:
        """Returns a list of companies that match the orgnr with the given operator

        Args:
            orgnr (str): _description_
            operator (Operator, optional): _description_. Defaults to Operator.EQUAL.

        Returns:
            List[CompanyJE]: _description_
        """
        if not valid_operator(operator):
            return None
        
        res = self._post_Je_HamtaForetag(
            variables= [
                Variable(
                    variable= "OrgNr (10 siffror)",
                    operator= operator,
                    val_1= orgnr
                )
            ]
        )
        
        return [CompanyJE.from_scb(c) for c in res]
        
    def count_companies_municipality(self, municipality_codes : List[str]) -> int:
        """Returns the number of companies in a specified municipality (Kommun)

        Args:
            region_code (str): _description_

        Returns:
            int: _description_
        """
        res = self._post_Je_RaknaForetag(
            categories= [
                SCBCategory(
                    category= "SätesKommun",
                    codes= municipality_codes
                )
            ]
        )
        
        return int(res)
    
    def count_companies_county(self, county_codes : List[str]) -> int:
        """Returns the number of companies in a specified county (Län)
        
        Args:
            county_code (str): _description_
            operator (Operator, optional): _description_. Defaults to Operator.EQUAL.

        Returns:
            int: _description_
        """
        res = self._post_Je_RaknaForetag(
            categories= [
                SCBCategory(
                    category= "SätesLän",
                    codes= county_codes
                )
            ]
        )
        
        return int(res)
    
    def get_category_codes(self, cat : Category, cat_tables = None):
        if cat_tables is None:
            cat_tables = self._get_Je_KategorierMedKodtabeller()
        
        cat_dict = next(
            (ct for ct in cat_tables if ct.get("Id_Kategori_JE") == cat), 
            None
        )
        
        if cat_dict is None:
            raise NameError(f"Category {cat} doesnt exist.")
        
        value_list = cat_dict.get("VardeLista", [])
        text = [v.get("Text") for v in value_list]
        values = [v.get("Varde") for v in value_list]
        
        return values, text
    
    def Je_count(self, 
            reg_status : str = "1", 
            co_status : str = "1", 
            variables : List[Variable] = [], 
            categories : List[SCBCategory] = []
        ):
        res = None
        try:
            res = self._post_Je_RaknaForetag(
                registration_status= reg_status,
                company_status= co_status,
                variables= variables,
                categories= categories
            )
            print("|", end="")
        except:
            raise Exception(f"EXCEPTION: {reg_status} {co_status} {variables} {categories}")
        
        return res if isinstance(res, int) else -9999
    
    def _partition(self, partitions : dict, level : int = 0):
        """ Recursive method to retrieve the category partitions to call the api
        with later to get the actual company data.
        """
        success_list = []
        fail_list = []
        zeros_list = []
        insufficient_list = []
        
        # Get the right partition for this level
        p_dict = partitions.get(level, None)
        
        # Extract category and values
        current_cat : Category = p_dict.get("cat", Category.EMPTY)
        
        if current_cat == Category.INDUSTRY:
            prev_val = [pd["values"][pd.get("active_value", 0)] for lvl, pd in partitions.items() if lvl == level - 1][0].get("Varde", "")
            current_values = [v for v in p_dict.get("values", []) if v.get("Varde","").startswith(prev_val)]
        else:
            current_values = p_dict.get("values", [])
        
        # DEBUGGING
        print(" " * level + f"======== {current_cat} ==========")
        
        # Get previous categories for previous levels
        prev_cats = [pd["cat"] for lvl, pd in partitions.items() if lvl < level]
        prev_vals = [pd["values"][pd.get("active_value", 0)] for lvl, pd in partitions.items() if lvl < level]
        prev_categories = [SCBCategory(c, codes=[v.get("Varde")]) for c, v in zip(prev_cats, prev_vals)]
        
        # NOTE: next_level is None if this is the last level
        next_level = level + 1 if level < max(partitions.keys()) else None 
        
        # Loop through all values, {"Text":None, "Varde":None}
        for _, vd in enumerate(current_values):
            categories = prev_categories + [SCBCategory(current_cat, codes=[vd.get("Varde")])]
            
            # Calculate the number of companies for the category combination
            num_co = self.Je_count(categories= categories)
            if num_co is None:
                continue
            
            p_dict["current_sum"] += num_co if num_co >= 0 else 0
            
            # DEBUGGING
            print(" " * level + f"{vd.get("Text")}: found {num_co} companies. ({p_dict["current_sum"]}) [{p_dict["active_value"]}]")
            
            cats = [cat.dict for cat in categories]
            data = {"num_co" : num_co, "num_cat" : len(cats), "cats" : cats}
                
            if self.within_limits(num_co):
                if num_co < 0:
                    fail_list.append(data)
                elif num_co > 0:
                    success_list.append(data)
                elif num_co == 0:
                    zeros_list.append(data)    
                           
            elif next_level is not None: 
                p_dict["current_sum"] = 0
                
                s, f, z, i = self._partition(partitions, level= next_level)
                success_list.extend(s)
                fail_list.extend(f)
                zeros_list.extend(z)
                insufficient_list.extend(i)
                
            else:
                insufficient_list.append(data)
            
            p_dict["active_value"] += 1
            
            if level == 0:
                continue
            
        p_dict["active_value"] = 0
        p_dict["current_sum"] = 0
        
        print(f"\t partitioning done: {len(success_list)}, {len(fail_list)}, {len(zeros_list)}, {len(insufficient_list)}")

        return success_list, fail_list, zeros_list, insufficient_list
                     
    def _get_company_partitions(self):
        """Returns all the category partitions using _partition()
        """
        # Gather all the available categories
        cat_tables = self._get_Je_KategorierMedKodtabeller()
        
        # Copy the partitions (need to be copied)
        partitions = copy.copy(PARTITIONS)
        
        # Extract and add the values to the partitions dict
        for _, p_dict in partitions.items():
            partition_cat = p_dict.get("cat", None)
            cat_dict = next(
                (ct for ct in cat_tables if ct.get("Id_Kategori_JE") == partition_cat), 
                None
            )
            
            if cat_dict is None:
                raise NameError(f"Partition category {partition_cat} doesnt exist.")
            
            values = cat_dict.get("VardeLista", [])
            p_dict["values"] = values if not p_dict.get("exclude_first_last") else values[1:-1]
        
        # Perform the calls   
        return self._partition(partitions)            
        
    def seed_all_companies(self) -> None:
        """ Calculates all the category partitions, perform the call
        to retrieve the companies and seed them into the db
        """
        success_list, fail_list, zeros_list, insufficient_list = self._get_company_partitions()
        
        with open("worker/scb/data/res/success_list.json", "w") as f:
            json.dump(success_list, f)
            
        with open("worker/scb/data/res/fail_list.json", "w") as f:
            json.dump(fail_list, f)
        
        with open("worker/scb/data/res/zeros_list.json", "w") as f:
            json.dump(zeros_list, f)
            
        with open("worker/scb/data/res/insufficient_list.json", "w") as f:
            json.dump(insufficient_list, f)
            
        # DEBUGGING
        expected_total = 0
        actual_total = 0
        update_freq = 100
        num_lines = len(success_list)
        
        data : dict
        for i, data in enumerate(success_list):
            # Extract values
            cats = data.get("cats", [])
            expected_num_co = data.get("num_co", -9999)
            catssss = [SCBCategory(
                category= cd.get("Kategori", Category.EMPTY), 
                codes= cd.get("Kod")) for cd in cats
            ]
            # Perform call
            res = self._post_Je_HamtaForetag(
                categories= catssss
            )
            
            # DEBUGGING
            num_co = len(res)
            expected_total += expected_num_co
            actual_total += num_co
            if num_co != expected_num_co:
                print(f"[{i}]: ERROR. expected {expected_num_co}, got {num_co}, cats: {catssss}")
            
            # Seed companies to db                
            with get_db_connection() as conn:
                for company in [CompanyJE.from_scb(c) for c in res]:
                    seed_company(conn, company)
                conn.commit()
            
            # DEBUGGING
            if i % update_freq == 0:
                print(f"[{i}] ({i/num_lines}%) ({i}/{num_lines}) expected: {expected_total} actual: {actual_total} diff: {expected_total-actual_total}")
            
        # DEBUGGING         
        print(f"DONE: expected: {expected_total} actual: {actual_total} diff: {expected_total-actual_total}")
