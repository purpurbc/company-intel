import psycopg
from psycopg.rows import dict_row
from worker.scb.config import DATABASE_URL

def get_db_connection():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)