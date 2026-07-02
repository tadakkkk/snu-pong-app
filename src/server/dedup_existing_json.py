"""이미 쌓인 enriched-items.json 백로그를 1회 정리한다.

DB 접근 없이 커밋된 JSON 파일만 dedup 한다.
다음 daily_crawl 실행 때 export_json()이 어차피 collapse 하지만,
크롤을 기다리지 않고 즉시 깨끗한 데이터로 배포하고 싶을 때 사용한다.

사용:
    python dedup_existing_json.py            # src/data/enriched-items.json 정리
    python dedup_existing_json.py --dry-run  # 변경 없이 요약만
"""

from __future__ import annotations

import argparse
import json
import os

from dedup import collapse

DEFAULT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "data", "enriched-items.json"
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--path", default=DEFAULT_PATH)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    path = os.path.abspath(args.path)
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    collapsed = collapse(data)
    removed = len(data) - len(collapsed)
    multi = sum(1 for c in collapsed if c.get("source_count", 1) > 1)
    print(f"원본 {len(data)}개 → 정리 후 {len(collapsed)}개 (중복 {removed}개 제거)")
    print(f"여러 게시판에 재게시된 공지: {multi}개 (source_count>1)")

    if args.dry_run:
        print("--dry-run: 파일 미변경")
        return

    with open(path, "w", encoding="utf-8") as f:
        json.dump(collapsed, f, ensure_ascii=False, indent=2)
    print(f"저장 완료 → {path}")


if __name__ == "__main__":
    main()
