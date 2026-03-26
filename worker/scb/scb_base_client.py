from __future__ import annotations

from worker.scb.utils.client_config import SCBClientConfig
from worker.scb.models.variable import Variable
from worker.scb.models.category import SCBCategory
from worker.scb.constants import SCB_JE_API, SCB_AE_API, SCB_MAX_ROWS_RETURNED

from typing import Any, Dict, Optional, Union, List
from requests_pkcs12 import get as pkcs12_get
from requests_pkcs12 import post as pkcs12_post
from typing import Any
import time

class SCBClient:
    """Minimal klient för SCB SokPaVar. Stöd för GET/POST med requests_pkcs12
    """
    def __init__(self, cfg: SCBClientConfig = SCBClientConfig.default()):
        self.cfg = cfg

    @property
    def base_url(self):
        return self.cfg.base_url
    
    @property
    def api_id(self):
        return self.cfg.api_id
    
    @property
    def pfx_path(self):
        return self.cfg.pfx_path
    
    @property
    def pfx_password(self):
        return self.cfg.pfx_password
    
    @property
    def timeout_s(self):
        return self.cfg.timeout_s
    
    def _url(self, path: str) -> str:
        return self.cfg.base_url.rstrip("/") + "/" + path.lstrip("/")

    def get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        """GET request using pkcs12_get
        """
        url = self._url(path)
        resp = pkcs12_get(
            url,
            pkcs12_filename=self.cfg.pfx_path,
            pkcs12_password=self.cfg.pfx_password,
            params=params,
            timeout=self.cfg.timeout_s,
        )
        resp.raise_for_status()
        return resp.json()

    def post(self, path: str, json_body: dict, max_failures : int = 15, fail_sleep : float = 2.0) -> dict:
        """POST request using pkcs12_post.
        """
        url = self._url(path)
        
        sleep = fail_sleep
        for n in range(max_failures):
            try:
                resp = pkcs12_post(
                    url,
                    pkcs12_filename=self.cfg.pfx_path,
                    pkcs12_password=self.cfg.pfx_password,
                    json=json_body,
                    timeout=self.cfg.timeout_s,
                )
                if not resp.ok:
                    
                    # DEBUGGING
                    # ---------
                    print(f"Failed post. Trying again after {sleep} s.\t[{n+1}/{max_failures}]")
                    if n + 1 == max_failures:
                        print(f"Max fail reached!\n\tSTATUS: {resp.status_code}\n\tRESPONSE: {resp.text}")
                    # ---------
                        
                    time.sleep(sleep)
                else:
                    # Response OK!
                    break
            except Exception as e:
                
                # DEBUGGING
                # ---------
                print(f"Unexpected error. Trying again after {sleep} s.\n\tERROR:{e}")
                # ---------
                
                time.sleep(sleep)
                
            sleep += fail_sleep
            
        if not resp:
            return {}
            
        resp.raise_for_status()
        return resp.json()

    
    # MARK: Ae
    # ==========================================
    
    def within_limits_Ae(self,
            status : str = "1", 
            variables : List[Variable] = [],
            categories : List[SCBCategory] = [],
        ) -> Union[Dict, List]:
        n = self._post_Ae_RaknaArbetsstallen(status, variables, categories, save=False)
        
        if n > SCB_MAX_ROWS_RETURNED:
            raise ValueError(
                f"Query would return {n} rows (> {SCB_MAX_ROWS_RETURNED}). "
                f"Add more filters (kommun/län/bransch/anställda/omsättning) or partition."
            )  
        return True
        
    def _get_Ae_KategorierMedKodtabeller(self) -> Union[Dict, List]:
        return self.get(f"{SCB_AE_API}KategorierMedKodtabeller")
    
    def _get_Ae_KoptaKategorier(self) -> Union[Dict, List]:
        return self.get(f"{SCB_AE_API}KoptaKategorier")
        
    def _get_Ae_Variabler(self) -> Union[Dict, List]:
        return self.get(f"{SCB_AE_API}Variabler")

    def _get_Ae_KoptaVariabler(self) -> Union[Dict, List]:
        return self.get(f"{SCB_AE_API}KoptaVariabler")
    
    def _post_Ae_Kodtabell(self, category : str) -> Union[Dict, List]:
        """POST api/Ae/Kodtabell	
        Hämtar kodtabell för en viss angiven kategori.
        """
        payload = {"Kategori": f"{category}"}
        return self.post(f"{SCB_AE_API}Kodtabell", payload)
    
    def _generic_post_Ae(self,
            name : str,
            status : str = "1", 
            variables : List[Variable] = [],
            categories : List[SCBCategory] = [],
            check_limits : bool = True
        ) -> Union[Dict, List]:
        """Generic POST request for Ae. (default payload)
        """
        if check_limits and not self.within_limits_Ae(status, variables, categories):
            return None
        
        payload = {
            "Arbetsställestatus": status,
            "Variabler": [v.dict for v in variables],
            "Kategorier": [c.dict for c in categories]
        }
        
        return self.post(f"{SCB_AE_API}{name}", payload)
         
    def _post_Ae_RaknaArbetsstallen(self, 
            status : str = "1", 
            variables : List[Variable] = [],
            categories : List[SCBCategory] = [],
        ) -> Union[Dict, List]:
        """POST api/Ae/RaknaArbetsstallen	
        Räkna antal arbetsställen
        """
        return self._generic_post_Ae("RaknaArbetsstallen", status, variables, categories, check_limits= False)
    
    def _post_Ae_HamtaArbetsstallen(self, 
            status : str = "1", 
            variables : List[Variable] = [],
            categories : List[SCBCategory] = [],
        ) -> Union[Dict, List]:
        """POST api/Ae/HamtaArbetsstallen	
        Hämta information om arbetsställen.
        """
        return self._generic_post_Ae("HamtaArbetsstallen", status, variables, categories)
    
    def _post_Ae_HamtaArbetsstallenXML(self, 
            status : str = "1", 
            variables : List[Variable] = [],
            categories : List[SCBCategory] = [],
        ) -> Union[Dict, List]:
        """POST api/Ae/HamtaArbetsstallenXML	
        Hämta information om arbetsställen (variabel värde) som XML eller JSON.
        """
        return self._generic_post_Ae("HamtaArbetsstallenXML", status, variables, categories)

    def _post_Ae_HamtaFirmor(self, 
            status : str = "1", 
            variables : List[Variable] = [],
            categories : List[SCBCategory] = [],
        ) -> Union[Dict, List]:
        """POST api/Ae/HamtaFirmor	
        Hämta information om firmor.
        """
        return self._generic_post_Ae("HamtaFirmor", status, variables, categories)
        
    def _post_Ae_HamtaFirmorXML(self, 
            status : str = "1", 
            variables : List[Variable] = [],
            categories : List[SCBCategory] = [],
            
        ) -> Union[Dict, List]:
        """POST api/Ae/HamtaFirmorXML	
        Hämta information om firmor (variabel värde) som XML eller JSON.
        """
        return self._generic_post_Ae("HamtaFirmorXML", status, variables, categories)
    
    # MARK: Je
    # ===========================================
    
    def within_limits_Je(self,
            registration_status : str = "1", 
            company_status : str = "1", 
            variables : List[Variable] = [],
            categories : List[SCBCategory] = [],
        ) -> Union[Dict, List]:
        """Returns whether or not the request will return N number of 
        lines that are lower than the maximum
        """
        n = self._post_Je_RaknaForetag(
            registration_status, 
            company_status, 
            variables, 
            categories
        )
        if n > SCB_MAX_ROWS_RETURNED:
            raise ValueError(
                f"Query would return {n} rows (> {SCB_MAX_ROWS_RETURNED}). "
                f"Add more filters (kommun/län/bransch/anställda/omsättning) or partition."
            )  
        return True
    
    def _get_Je_KategorierMedKodtabeller(self) -> Union[Dict, List]:
        """GET api/Je/KategorierMedKodtabeller	
        Hämtar alla kategorier med kodtabeller som finns.
        """
        return self.get(f"{SCB_JE_API}KategorierMedKodtabeller")
    
    def _get_Je_KoptaKategorier(self) -> Union[Dict, List]:
        """GET api/Je/KoptaKategorier	
        Hämtar alla kategorier som inloggad kund har köpt eller har tillgång till.
        """
        return self.get(f"{SCB_JE_API}KoptaKategorier")
    
    def _get_Je_Variabler(self) -> Union[Dict, List]:
        """GET api/Je/Variabler	
        Hämtar alla JE variabler som finns.
        """
        return self.get(f"{SCB_JE_API}Variabler")
    
    def _get_Je_KoptaVariabler(self) -> Union[Dict, List]:
        """GET api/Je/KoptaVariabler	
        Hämtar alla variabler som inloggad kund har köpt eller har tillgång till.
        """
        return self.get(f"{SCB_JE_API}KoptaVariabler")
    
    def _get_Je_SektorFil(self) -> Union[Dict, List]:
        """GET api/Je/SektorFil	
        För aktuell kund är inte metoden tillgänglig.
        """
        raise NotImplementedError
    
    def _post_Je_Kodtabell(self, category : str) -> Union[Dict, List]:
        """POST api/Je/Kodtabell	
        Hämtar kodtabell för en viss angiven kategori.
        """
        payload = {"Kategori": f"{category}"}
        return self.post(f"{SCB_JE_API}Kodtabell", payload)
    
    def _generic_post_Je(self,
            name : str,
            registration_status : str = "1", 
            company_status : str = "1", 
            variables : List[Variable] = [],
            categories : List[SCBCategory] = [],
            check_limits : bool = True
        ) -> Union[Dict, List]:
        """Generic POST request for Je. (default payload)
        """
        if check_limits and not self.within_limits_Je(registration_status, company_status, variables, categories):
            return None
        
        payload = {
            "Registreringsstatus": registration_status,
            "Företagsstatus": company_status,
            "Variabler": [v.dict for v in variables],
            "Kategorier": [c.dict for c in categories]
        }
        
        return self.post(f"{SCB_JE_API}{name}", payload)
    
    def _post_Je_RaknaForetag(self, 
            registration_status : str = "1", 
            company_status : str = "1", 
            variables : List[Variable] = [],
            categories : List[SCBCategory] = [],
        ) -> Union[Dict, List]:
        """POST api/Je/RaknaForetag	
        Räknar antal företag.
        """
        return self._generic_post_Je("RaknaForetag", registration_status, company_status, variables, categories, check_limits= False)
    
    def _post_Je_HamtaForetag(self, 
            registration_status : str = "1", 
            company_status : str = "1", 
            variables : List[Variable] = [],
            categories : List[SCBCategory] = [],
            
        ) -> Union[Dict, List]:
        """POST api/Je/HamtaForetag	
        Hämtar information om företag
        """
        return self._generic_post_Je("HamtaForetag", registration_status, company_status, variables, categories)
    
    
    def _post_Je_HamtaForetagXML(self, 
            registration_status : str = "1", 
            company_status : str = "1", 
            variables : List[Variable] = [],
            categories : List[SCBCategory] = [],
            
        ) -> Union[Dict, List]:
        """POST api/Je/HamtaForetagXML	
        Hämtar information om företag (variabel värde) som XML eller JSON.
        """
        return self._generic_post_Je("HamtaForetagXML", registration_status, company_status, variables, categories)
    
    def _post_Je_HamtaFirmor(self, 
            registration_status : str = "1", 
            company_status : str = "1", 
            variables : List[Variable] = [],
            categories : List[SCBCategory] = [],
            
        ) -> Union[Dict, List]:
        """POST api/Je/HamtaFirmor	
        Hämtar information om firmor.
        """
        return self._generic_post_Je("HamtaFirmor", registration_status, company_status, variables, categories)
    
    def _post_Je_HamtaFirmorXML(self, 
            registration_status : str = "1", 
            company_status : str = "1", 
            variables : List[Variable] = [],
            categories : List[SCBCategory] = [],
            
        ) -> Union[Dict, List]:
        """POST api/Je/HamtaFirmorXML	
        Hämtar information om firmor (variabel värde) som XML eller JSON.
        """
        return self._generic_post_Je("HamtaFirmorXML", registration_status, company_status, variables, categories)