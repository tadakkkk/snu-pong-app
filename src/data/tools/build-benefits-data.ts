// 크롤 결과(src/data/enriched-items.json)에서 두 가지 산출물을 만든다.
//
//  1. public/data/benefits.json — 전체 데이터. 정적 자산으로 나가며, 다음 단계에서
//     앱이 런타임에 받아갈 대상이다. 원본을 그대로 내보내되 minify만 한다.
//  2. src/data/seed-items.json — JS 번들에 들어가는 오프라인 시드. 원본을 그대로
//     넣으면 2MB 청크가 되므로, 되살아날 수 없는 레코드를 걷어내고 null을 턴다.
//
// 원본 위치는 건드리지 않는다. Daily Crawl 워크플로우는 계속
// src/data/enriched-items.json만 갱신/커밋한다.

import { mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";

const SOURCE = "src/data/enriched-items.json";
const RUNTIME_OUT = "public/data/benefits.json";
const SEED_OUT = "src/data/seed-items.json";

/**
 * 만료 판정에 두는 여유 일수.
 *
 * buildItems는 기기의 현재 날짜로 만료를 다시 판정한다. 빌드 머신과 기기의
 * 시간대가 어긋나도 아직 살아있는 항목이 시드에서 잘려나가지 않도록 이틀 물린다.
 */
const EXPIRY_GRACE_DAYS = 2;

interface RawRecord {
  is_benefit?: boolean;
  deadline_date?: string | null;
  [key: string]: unknown;
}

/** items.ts의 _todayISO와 같은 기준(KST). */
function kstDateOffsetBy(days: number): string {
  const ms = Date.now() + 9 * 60 * 60 * 1000 + days * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * 시드에 남길 레코드인지 판정한다.
 *
 * buildItems가 런타임에 똑같이 걸러내는 조건 중 **단방향인 것만** 쓴다.
 * 한 번 참이 되면 계속 참이라, 빌드 시점에 미리 빼도 나중에 되살아나지 않는다.
 *  - is_benefit === false : 혜택이 아니라고 판정된 항목
 *  - 마감일이 지난 항목    : 지난 날짜가 다시 미래가 되지는 않는다
 *
 * url 중복 제거나 review_priority 정렬처럼 목록 전체를 봐야 하는 처리는
 * 여기서 하지 않는다. 그건 buildItems가 런타임에 할 일이다.
 */
function keepInSeed(rec: RawRecord, expiryCutoff: string): boolean {
  if (rec.is_benefit === false) return false;
  const deadline = rec.deadline_date;
  if (typeof deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    if (deadline < expiryCutoff) return false;
  }
  return true;
}

// 필드 값은 손대지 않는다. null을 털면 시드가 128KB쯤 더 줄지만, 변환 결과의
// 해당 필드가 null 대신 undefined가 되어 buildItems 출력이 원본과 바이트 단위로
// 달라진다. 앱이 그 필드들을 전부 nullish로만 읽어서 동작은 같지만, 절감폭이
// 레코드 필터링(2.44MB→0.78MB)에 비해 작아 "출력이 완전히 동일하다"는 보증을 택했다.

function writeJson(relPath: string, value: unknown): number {
  const outPath = resolve(process.cwd(), relPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(value), "utf-8");
  return statSync(outPath).size;
}

function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

function main() {
  const sourcePath = resolve(process.cwd(), SOURCE);
  const raw = JSON.parse(readFileSync(sourcePath, "utf-8")) as RawRecord[];
  const sourceBytes = statSync(sourcePath).size;

  const runtimeBytes = writeJson(RUNTIME_OUT, raw);
  console.log(
    `✓ ${RUNTIME_OUT} — ${raw.length} records, ${mb(sourceBytes)} → ${mb(runtimeBytes)}`
  );

  const expiryCutoff = kstDateOffsetBy(-EXPIRY_GRACE_DAYS);
  const seed = raw.filter((r) => keepInSeed(r, expiryCutoff));
  const seedBytes = writeJson(SEED_OUT, seed);
  console.log(
    `✓ ${SEED_OUT} — ${seed.length}/${raw.length} records kept (expiry cutoff ${expiryCutoff}), ${mb(seedBytes)}`
  );
}

main();
