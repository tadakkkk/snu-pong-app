from __future__ import annotations

import json
import os
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[3]
SERVER_DIR = PROJECT_ROOT / "src" / "server"
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from main import enrich_records


def main() -> None:
    if not os.environ.get("ANTHROPIC_API_KEY", "").strip():
        raise RuntimeError("ANTHROPIC_API_KEY is missing or empty")

    crawled_path = PROJECT_ROOT / "src" / "data" / "crawled-items.json"
    output_path = PROJECT_ROOT / "src" / "data" / "enriched-items.json"

    if not crawled_path.exists():
        raise FileNotFoundError(f"crawled-items.json not found at {crawled_path}")

    with crawled_path.open("r", encoding="utf-8") as file:
        items = json.load(file)

    print(f"Loaded {len(items)} items")
    enriched = enrich_records(items)

    with output_path.open("w", encoding="utf-8") as file:
        json.dump(enriched, file, ensure_ascii=False, indent=2)

    estimated = sum(
        1 for item in enriched if item.get("estimated_value") is not None
    )
    intentionally_unvalued = sum(
        1
        for item in enriched
        if item.get("is_benefit")
        and item.get("estimated_value") is None
    )
    print(
        f"Done: {len(enriched)} items, {estimated} valued, "
        f"{intentionally_unvalued} intentionally unvalued"
    )


if __name__ == "__main__":
    main()
