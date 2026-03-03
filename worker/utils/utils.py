from datetime import datetime

def current_timestamp() -> str:
    """
    Returns current timestamp formatted as:
    DD MM YY HH:MM:SS
    """
    return datetime.now().strftime("%d%m%y-%H%M%S")
