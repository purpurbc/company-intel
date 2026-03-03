from dataclasses import dataclass, asdict, field
from typing import List, Dict, Any
from enum import Enum

class Category(str, Enum):
    # Shared
    INDUSTRY_2_DIGIT = "2-siffrig bransch 1"
    INDUSTRY = "Bransch"
    EMPLOYEES = "Anställda"
    ADVERTISING = "Reklam"
    ADDRESS_STATUS = "Adresstatus"
    EMPLOYEES_SME = "Anställda SME"
    OWNER_CONTROL = "Ägarkontroll"
    PRIVATE_PUBLIC = "Privat/publikt"
    SECTOR = "Sektor"
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
    COMPANY_STATUS = "Företagsstatus"
    REGISTRATION_STATUS = "Registreringsstatus"
    SEAT_MUNICIPALITY = "SätesKommun"
    SEAT_COUNTY = "SätesLän"
    SEAT_AREGION = "ARegion (Säteskommun)"
    LEGAL_FORM = "Juridisk form"
    TURNOVER_CLASS_FIN = "Omsättningsklass fin"
    TURNOVER_CLASS_GROSS = "Omsättningsklass grov"
    EMPLOYER_STATUS = "Arbetsgivarstatus"
    VAT_STATUS = "Momsstatus"
    F_TAX_STATUS = "F-skattstatus"
    COMPANY_STATE = "Bolagsstatus"
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