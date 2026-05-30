#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import db

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENRICHED_ITEMS_PATH = PROJECT_ROOT / "src" / "data" / "enriched-items.json"


def main() -> None:
    print(f"Loading {ENRICHED_ITEMS_PATH} ...")
    with open(ENRICHED_ITEMS_PATH, encoding="utf-8") as f:
        records = json.load(f)
    print("Initializing database tables ...")
    db.init_db()
    print(f"Upserting {len(records)} records ...")
    db.upsert_items(records)
    print(f"Done. {len(records)} records seeded into benefit_items.")


if __name__ == "__main__":
    main()
