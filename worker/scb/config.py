from worker.scb.models.category import Category
import os

# DB
DATABASE_URL = os.getenv("DATABASE_URL", "")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# SCB
SCB_BASE_URL = os.getenv("SCB_BASE_URL", "https://privateapi.scb.se/nv0101/v1/sokpavar/")
SCB_TIMEOUT_S = int(os.getenv("SCB_TIMEOUT_S", "30"))
SCB_API_ID = os.getenv("SCB_API_ID", "")
SCB_CERT_FILEPATH = os.getenv("SCB_CERT_FILEPATH", "")
SCB_CERT_PASSWORD = os.getenv("SCB_CERT_PASSWORD", "")

PARTITIONS = {
    0: {"cat": Category.SEAT_MUNICIPALITY,   "exclude_first_last": False, "active_value": 0, "current_sum": 0, "values": None},
    1: {"cat": Category.EMPLOYEES,           "exclude_first_last": False, "active_value": 0, "current_sum": 0, "values": None},
    2: {"cat": Category.TURNOVER_CLASS_GROSS,  "exclude_first_last": False, "active_value": 0, "current_sum": 0, "values": None},
    3: {"cat": Category.INDUSTRY_2_DIGIT,    "exclude_first_last": False, "active_value": 0, "current_sum": 0, "values": None},
    4: {"cat": Category.INDUSTRY,            "exclude_first_last": False, "active_value": 0, "current_sum": 0, "values": None},
    5: {"cat": Category.LEGAL_FORM,            "exclude_first_last": False, "active_value": 0, "current_sum": 0, "values": None},
    6: {"cat": Category.COMPANY_STATE,  "exclude_first_last": False, "active_value": 0, "current_sum": 0, "values": None},
    7: {"cat": Category.OWNER_CONTROL,    "exclude_first_last": False, "active_value": 0, "current_sum": 0, "values": None},
    8: {"cat": Category.EMPLOYEES_SME,            "exclude_first_last": False, "active_value": 0, "current_sum": 0, "values": None},
    9: {"cat": Category.ADDRESS_STATUS,  "exclude_first_last": False, "active_value": 0, "current_sum": 0, "values": None},
    10: {"cat": Category.EMPLOYER_STATUS,            "exclude_first_last": False, "active_value": 0, "current_sum": 0, "values": None},
    11: {"cat": Category.F_TAX_STATUS,            "exclude_first_last": False, "active_value": 0, "current_sum": 0, "values": None},
}