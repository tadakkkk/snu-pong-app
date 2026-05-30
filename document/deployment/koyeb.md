# Koyeb 배포 가이드

## 서버 구조

```
크롤링(제목+본문) → AI 정제 → Neon DB 저장 → 앱이 DB 읽어서 표시
```

매일 05:00 KST에 자동 크롤링+정제+DB 저장 실행.

## Koyeb 설정

**Build command**
```
pip install -r src/server/requirements.txt
```

**Run command**
```
cd src/server && uvicorn main:app --host 0.0.0.0 --port $PORT
```

**환경 변수** (Koyeb > Service > Environment)

| 변수명 | 설명 |
|--------|------|
| `DATABASE_URL` | Neon Postgres 연결 문자열 (`postgresql://user:pass@host.neon.tech/db?sslmode=require`) |
| `ANTHROPIC_API_KEY` | Claude API 키 (AI 정제용) |
| `PORT` | Koyeb이 자동으로 주입 — 직접 설정 불필요 |

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/health` | 헬스체크 |
| GET | `/api/items` | 혜택 목록 (`?category=scholarship` 등 필터 가능) |
| GET | `/api/items/{id}` | 혜택 상세 |
| GET | `/api/sources` | 크롤러 소스 목록 |
| POST | `/api/crawl` | 크롤링 수동 트리거 (백그라운드 실행) |

## 초기 데이터 세팅 (최초 1회)

```bash
export DATABASE_URL="postgresql://..."
python src/server/seed_db.py
```

`src/data/enriched-items.json`의 34개 항목을 Neon DB에 업서트합니다.

## 로컬 테스트

```bash
export DATABASE_URL="postgresql://..."
export ANTHROPIC_API_KEY="sk-ant-..."

# DB 초기화 + 시드 데이터 입력
python src/server/seed_db.py

# 서버 기동
cd src/server && uvicorn main:app --reload

# 동작 확인
curl http://localhost:8000/health
curl http://localhost:8000/api/items
curl http://localhost:8000/api/items?category=scholarship
curl http://localhost:8000/api/sources
```
