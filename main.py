from dotenv import load_dotenv
load_dotenv()

from worker.scb.scb_custom_client import SCBCustomClient

if __name__ == "__main__":
    client = SCBCustomClient()
    client.seed_all_companies()