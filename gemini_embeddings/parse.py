
import os
import json
from urllib.request import urlopen
from dotenv import load_dotenv
load_dotenv()

API_BASE_URL = os.environ["API_BASE_URL"]
print(f"Using API_BASE_URL: {API_BASE_URL}")

def fetch_json(path: str):
    with urlopen(f"{API_BASE_URL}{path}") as response:
        return json.load(response)

if __name__ == "__main__":
    counties = fetch_json("/options/counties")
    print(json.dumps(counties, ensure_ascii=False, indent=2))
