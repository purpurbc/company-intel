import psycopg
from psycopg.rows import dict_row
from worker.scb.config import DATABASE_URL

def get_db_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is missing. Set it in .env before running the worker.")

    return psycopg.connect(DATABASE_URL, row_factory=dict_row)
