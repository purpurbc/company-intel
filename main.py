from dotenv import load_dotenv
load_dotenv()

from worker.scb.scb_custom_client import SCBCustomClient
from worker.scb.models.category import SCBCategory, Category
from worker.seed.seed_company import seed_company
from worker.database import get_db_connection
from worker.scb.models.company import CompanyJE
import time
if __name__ == "__main__":
    client = SCBCustomClient()
    #client.seed_all_companies()
    print(client.Je_count())
    
    #cc = Category.ADDRESS_STATUS
    #codes, _ = client.get_category_codes(cc)
    #print(len(codes), codes)
    """ 
    res = client.Je_count(
        
        categories= [
            SCBCategory(cc, codes=codes),
        ]
    )
    print(res) """
    if False:
        summa = 0
        for c in codes:
            res = client.Je_count(
                categories= [
                    SCBCategory(cc, codes=[c]),
                ]
            )
            summa += res
        print(summa)
       
    """ codes, _ = client.get_category_codes(Category.SECTOR)
    print(len(codes))
    
    codes, _ = client.get_category_codes(Category.EMPLOYEES)
    print(len(codes))
    
    codes, _ = client.get_category_codes(Category.TURNOVER_CLASS_FIN)
    print(len(codes))
    
    codes, _ = client.get_category_codes(Category.INDUSTRY_2_DIGIT)
    print(len(codes))
    
    codes, _ = client.get_category_codes(Category.INDUSTRY)
    
    print(len(codes)) """
    #
    
            