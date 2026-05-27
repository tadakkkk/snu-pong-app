# 서울대 등록금 뽕뽑기

낸 등록금만큼 누리고 졸업하기 — 서울대 학생을 위한 교내 혜택 추적 앱

## 소개

서울대 학생이 등록금으로 이용할 수 있는 교내 서비스와 혜택을 모아 가치로 환산해줍니다. 내가 얼마나 뽑았는지 학기별로 기록하고, 등록금 대비 몇 %를 활용하고 있는지 확인할 수 있어요.

## 주요 기능

- **개인화 온보딩** — 관심 분야 선택 → 단과대/등록금 입력 → 잠재 가치 확인
- **혜택 탐색** — 카테고리/사이트별 필터, 마감 임박 순 정렬, 키워드 검색
- **뽕뽑기 기록** — 이용한 혜택 체크 + 학기별 누적 가치 집계
- **공유 카드** — 내 뽕뽑기 현황을 카드로 공유
- **자동 수집** — GitHub Actions로 교내 공지에서 새 혜택 크롤링 및 자동 보강

## 기술 스택

- **프레임워크**: Next.js 16 (App Router, Turbopack)
- **상태관리**: Zustand v5 (localStorage persist)
- **스타일**: Tailwind CSS v4
- **언어**: TypeScript
- **마스코트**: 까치 (Pixel art SVG)

## 로컬 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인

## 프로젝트 구조

```
src/
├── app/
│   ├── onboarding/   # 온보딩 플로우 (관심분야 → 등록금 → 결과)
│   ├── home/         # 홈 (누적 가치, 추천 항목)
│   ├── pong/         # 혜택 목록 + 상세
│   └── records/      # 뽕뽑기 기록
├── components/
│   ├── magpie/       # 까치 마스코트 SVG (상태별)
│   └── ui/           # 공통 컴포넌트
├── data/
│   ├── items.ts      # 검증된 혜택 항목
│   └── crawled-items.json  # 자동 수집 항목
└── store/
    ├── user.ts       # 프로필 + 관심분야
    ├── pong.ts       # 뽕뽑기 기록
    └── semester.ts   # 학기 관리
```

## 기여

공동 작업자로 등록된 경우 `main` 브랜치로 직접 PR 요청해주세요.
