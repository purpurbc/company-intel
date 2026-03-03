import os
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

ALLOWED_ORIGIN = "http://localhost:3000"