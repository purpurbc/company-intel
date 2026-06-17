
import os
import json
from urllib.parse import urlencode
from urllib.request import urlopen
from dotenv import load_dotenv
load_dotenv()

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")

class CompanyClient:
    def __init__(self):
        pass

    def __fetch_json(self, path: str):
        with urlopen(f"{API_BASE_URL}{path}") as response:
            return json.load(response)
    
    def get_companies(self, limit: int = 1000):
        items = []
        page_size = 500

        for offset in range(0, limit, page_size):
            params = urlencode({
                "limit": min(page_size, limit - offset),
                "offset": offset,
                "search_by": "all",
            })
            data = self.__fetch_json(f"/companies?{params}")
            items.extend(data.get("items", []))

            if len(items) >= data.get("total", 0):
                break

        return items[:limit]
