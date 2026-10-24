"""Сохранить OpenAPI-схему в docs/openapi.json — из неё фронтенд генерирует типы.

    python -m app.export_openapi
"""

import json
from pathlib import Path

from app.main import app

TARGET = Path(__file__).resolve().parents[2] / "docs" / "openapi.json"

if __name__ == "__main__":
    TARGET.parent.mkdir(exist_ok=True)
    TARGET.write_text(json.dumps(app.openapi(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OpenAPI сохранён в {TARGET}")
