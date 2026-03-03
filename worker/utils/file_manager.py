from pathlib import Path
import json
from typing import Any

class FileManager():
    def __init__(self):
        pass
        
    def save_json(path: str | Path, data: Any) -> None:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)

        with path.open("w", encoding="utf-8") as f:
            json.dump(
                data,
                f,
                indent=4,
                ensure_ascii=False,
                sort_keys=True  
            )
            
    def read_json(path: str | Path) -> Any:
        path = Path(path)

        if not path.is_file():
            raise FileNotFoundError(f"{path} does not exist.")

        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
