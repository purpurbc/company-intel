from worker.scb.config import SCB_BASE_URL, SCB_API_ID, SCB_CERT_FILEPATH, SCB_CERT_PASSWORD, SCB_TIMEOUT_S

from dataclasses import dataclass

@dataclass(frozen=True)
class SCBClientConfig:
    base_url: str= ""
    api_id: str= ""
    pfx_path: str= ""
    pfx_password: str= ""
    timeout_s: int= 0
    
    @classmethod
    def default(cls):
        return cls(
            base_url = SCB_BASE_URL,
            api_id= SCB_API_ID,
            pfx_path = SCB_CERT_FILEPATH,
            pfx_password = SCB_CERT_PASSWORD,
            timeout_s = SCB_TIMEOUT_S
        )
        