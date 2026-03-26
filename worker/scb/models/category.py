from dataclasses import dataclass, asdict, field
from typing import List, Dict, Any
from enum import Enum

class Category(str, Enum):
    # Shared
    INDUSTRY_2_DIGIT = "2-siffrig bransch 1"    # 88 OK
    INDUSTRY = "Bransch"                        
    EMPLOYEES = "Anställda"                     # 17 OK
    ADVERTISING = "Reklam"                      # 6 OK
    ADDRESS_STATUS = "Adresstatus"              # 4 OK
    EMPLOYEES_SME = "Anställda SME"             # 6 OK
    OWNER_CONTROL = "Ägarkontroll"              # 6 OK
    PRIVATE_PUBLIC = "Privat/publikt"           # 8 OK
    SECTOR = "Sektor"                           # 53 OK
    EMPTY = ""

    # AE
    WORKPLACE_STATUS = "Arbetsställestatus"
    MUNICIPALITY = "Kommun"
    COUNTY = "Län"
    AREGION = "ARegion"
    AUX_WORKPLACE = "Hjälparbetsställe"
    WORKPLACE_TYPE = "Typ av arbetsställe"
    LOCALITY_TYPE = "Typ av ort"

    # JE
    COMPANY_STATUS = "Företagsstatus"               # 3 OK
    REGISTRATION_STATUS = "Registreringsstatus"     # 2 OK
    SEAT_MUNICIPALITY = "SätesKommun"               # 292 OK
    SEAT_COUNTY = "SätesLän"                        # 23 OK
    SEAT_AREGION = "ARegion (Säteskommun)"          # 71 OK
    LEGAL_FORM = "Juridisk form"                    # 35 OK
    TURNOVER_CLASS_FIN = "Omsättningsklass fin"     # 21 NOT OK 1122400
    TURNOVER_CLASS_GROSS = "Omsättningsklass grov"  # 13 OK
    EMPLOYER_STATUS = "Arbetsgivarstatus"           # 6 OK
    VAT_STATUS = "Momsstatus" # 4
    F_TAX_STATUS = "F-skattstatus"  # 3
    COMPANY_STATE = "Bolagsstatus" # 46
    EXPORT_TURNOVER = "Exportomsättning"
    IMPORT_TURNOVER = "Importomsättning"


@dataclass(frozen=True)
class SCBCategory:
    category: Category = Category.EMPTY
    codes: List[str] = field(default_factory=list)
    level: int = 1
    
    @property
    def dict(self):
        return {
            "Kategori": self.category,
            "Kod": self.codes,
            "BranschNiva": self.level
        }
    
    @property    
    def as_dict(self):
        return asdict(self)
    
    
@dataclass(frozen=True)
class SCBCategoryJE:
    cat_id: str = ""
    group: str = ""
    
    @property
    def dict(self):
        return {
            "Id_Kategori_JE": self.cat_id,
            "TillaggsGrupp": self.group,
        }
    
    @property    
    def as_dict(self):
        return asdict(self)
    
    
@dataclass(frozen=True)
class SCBCategoryAE:
    cat_id: str = ""
    group: str = ""
    
    @property
    def dict(self):
        return {
            "Id_Kategori_AE": self.cat_id,
            "TillaggsGrupp": self.group,
        }
    
    @property    
    def as_dict(self):
        return asdict(self)


@dataclass(frozen=True)
class CategoryValue:
    text: str  
    value: str 

    @staticmethod
    def from_dict(d: Dict[str, Any]) -> "CategoryValue":
        return CategoryValue(
            text=d.get("Text", "").strip(),
            value=d.get("Varde", "").strip(),
        )
 
    
@dataclass(frozen=True)
class JECategoryDefinition:
    datatype: str                
    extra_information: str    
    category_id: str             
    length: int               
    tillaggsgrupp: str           
    values: List[CategoryValue]  

    @staticmethod
    def from_dict(d: Dict[str, Any]) -> "JECategoryDefinition":
        return JECategoryDefinition(
            datatype=d.get("Datatyp", ""),
            extra_information=d.get("ExtraInformation", ""),
            category_id=d.get("Id_Kategori_JE", ""),
            length=int(d.get("Langd", 0)),
            tillaggsgrupp=d.get("TillaggsGrupp", ""),
            values=[
                CategoryValue.from_dict(v)
                for v in d.get("VardeLista", [])
            ],
        ) 