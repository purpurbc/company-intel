from dataclasses import dataclass, asdict
from enum import Enum

class Operator(str, Enum):
    EQUAL = "ArLikaMed"
    STARTS_WITH = "BorjarPa"
    CONTAINS = "Innehaller"
    BETWEEN = "Mellan"
    EXISTS = "Finns"
    NOT_EXISTS = "FinnsInte"
    AFTER = "FranOchMed"
    UNTIL = "TillOchMed"
    EMPTY = ""
    

@dataclass(frozen=True)
class Variable:
    variable: str = ""
    operator: Operator = Operator.EMPTY
    val_1: str = ""
    val_2: str = ""
    
    @property
    def dict(self):
        return {
            "Variabel": self.variable,
            "Operator": self.operator,
            "Varde1": self.val_1,
            "Varde2": self.val_2
        }
    
    @property    
    def as_dict(self):
        return asdict(self)
    
    
@dataclass(frozen=True)
class VariableJE:
    var_id: str = ""
    group: str = ""
    
    @property
    def dict(self):
        return {
            "Id_Variabel_JE": self.var_id,
            "TillaggsGrupp": self.group,
        }
    
    @property    
    def as_dict(self):
        return asdict(self)
    
    
@dataclass(frozen=True)
class VariableAE:
    var_id: str = "" 
    group: str = ""
    
    @property
    def dict(self):
        return {
            "Id_Variabel_AE": self.var_id,
            "TillaggsGrupp": self.group,
        }
    
    @property    
    def as_dict(self):
        return asdict(self)
    