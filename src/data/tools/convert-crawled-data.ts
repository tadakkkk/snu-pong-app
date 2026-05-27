import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

interface CrawledItem {
  id: string;
  name: string;
  category: string;
  source_url: string;
  provider: string;
  deadline_hints: string[];
  value_status: string;
  value_basis_hint: string;
  review_priority: string;
  status: string;
  source: "crawled";
  body_excerpt: string;
  outbound_links: string[];
}

// Extracts all top-level (...) row groups from the block following a VALUES keyword.
// Handles nested parens and single-quoted strings (with '' escaping) correctly.
function extractRows(sql: string, tableName: string): string[] {
  const insertIdx = sql.indexOf(`INSERT INTO ${tableName}`);
  if (insertIdx === -1) return [];
  const valuesIdx = sql.indexOf("VALUES", insertIdx);
  if (valuesIdx === -1) return [];
  const block = sql.slice(valuesIdx + 6);

  const rows: string[] = [];
  let depth = 0;
  let current = "";
  let inString = false;

  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    if (inString) {
      if (ch === "'" && block[i + 1] === "'") {
        current += "''";
        i++;
      } else if (ch === "'") {
        inString = false;
        current += ch;
      } else {
        current += ch;
      }
    } else {
      if (ch === "'") {
        inString = true;
        current += ch;
      } else if (ch === "(") {
        if (depth === 0) current = "";
        else current += ch;
        depth++;
      } else if (ch === ")") {
        depth--;
        if (depth === 0) {
          if (current.trim()) rows.push(current);
          current = "";
        } else {
          current += ch;
        }
      } else {
        current += ch;
      }
    }
  }
  return rows;
}

// Parses only single-quoted string values (TEXT / JSONB columns).
// Used for snuc_benefit_item_drafts where every column is quoted.
function parseStringValues(row: string): string[] {
  const values: string[] = [];
  let i = 0;
  while (i < row.length) {
    const ch = row[i];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === ",") {
      i++;
      continue;
    }
    if (ch === "'") {
      let str = "";
      i++;
      while (i < row.length) {
        if (row[i] === "'" && row[i + 1] === "'") {
          str += "'";
          i += 2;
        } else if (row[i] === "'") {
          i++;
          break;
        } else {
          str += row[i++];
        }
      }
      // skip type cast (::jsonb, ::text, etc.)
      while (i < row.length && row[i] !== ",") i++;
      values.push(str);
    } else {
      i++;
    }
  }
  return values;
}

// Parses all SQL value types: quoted strings, NULL, true/false, integers.
// Used for snuc_raw_articles which contains mixed column types.
function parseAllValues(row: string): (string | null)[] {
  const values: (string | null)[] = [];
  let i = 0;

  while (i < row.length) {
    while (i < row.length && " \t\n\r,".includes(row[i])) i++;
    if (i >= row.length) break;

    const ch = row[i];

    if (ch === "'") {
      let str = "";
      i++;
      while (i < row.length) {
        if (row[i] === "'" && row[i + 1] === "'") {
          str += "'";
          i += 2;
        } else if (row[i] === "'") {
          i++;
          break;
        } else {
          str += row[i++];
        }
      }
      // skip ::jsonb, ::text etc.
      while (i < row.length && row[i] === ":") i++;
      while (i < row.length && /[a-zA-Z]/.test(row[i])) i++;
      values.push(str);
    } else if (row.slice(i, i + 4).toUpperCase() === "NULL") {
      values.push(null);
      i += 4;
      while (i < row.length && row[i] !== ",") i++;
    } else if (row.slice(i, i + 4).toUpperCase() === "TRUE") {
      values.push("true");
      i += 4;
      while (i < row.length && row[i] !== ",") i++;
    } else if (row.slice(i, i + 5).toUpperCase() === "FALSE") {
      values.push("false");
      i += 5;
      while (i < row.length && row[i] !== ",") i++;
    } else if ((ch >= "0" && ch <= "9") || ch === "-") {
      let num = "";
      while (i < row.length && row[i] !== "," && !" \t\n\r".includes(row[i])) {
        num += row[i++];
      }
      while (i < row.length && row[i] !== ",") i++;
      values.push(num);
    } else {
      i++;
    }
  }
  return values;
}

function parseJsonArray(s: string): string[] {
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

interface RawArticleData {
  body_excerpt: string;
  outbound_links: string[];
}

// snuc_raw_articles columns (15 total):
// 0:uid 1:source_id 2:crawl_run_id 3:source_url 4:title 5:board_category(nullable)
// 6:author(nullable) 7:published_at 8:views(int) 9:project_categories(jsonb)
// 10:value_signal 11:is_benefit_candidate(bool) 12:deadline_hints(jsonb)
// 13:outbound_links(jsonb) 14:body_excerpt
function buildRawArticleMap(sql: string): Map<string, RawArticleData> {
  const map = new Map<string, RawArticleData>();
  const rows = extractRows(sql, "snuc_raw_articles");

  for (const row of rows) {
    const vals = parseAllValues(row);
    if (vals.length < 15) continue;
    const uid = vals[0];
    if (!uid) continue;
    map.set(uid, {
      outbound_links: parseJsonArray(vals[13] ?? "[]"),
      body_excerpt: vals[14] ?? "",
    });
  }
  return map;
}

function main() {
  const sqlPath = resolve(
    process.cwd(),
    "src/data/crawled/snuc_notice_sample_database.sql"
  );
  const outPath = resolve(process.cwd(), "src/data/crawled-items.json");

  const sql = readFileSync(sqlPath, "utf-8");

  const rawArticleMap = buildRawArticleMap(sql);
  console.log(`✓ Indexed ${rawArticleMap.size} raw articles`);

  // snuc_benefit_item_drafts columns (11 total, all quoted):
  // 0:id 1:raw_article_uid 2:status 3:name 4:category 5:source_url
  // 6:provider 7:deadline_hints(jsonb) 8:value_status 9:value_basis_hint 10:review_priority
  const rows = extractRows(sql, "snuc_benefit_item_drafts");
  const items: CrawledItem[] = [];

  for (const row of rows) {
    const vals = parseStringValues(row);
    if (vals.length < 11) {
      console.warn(`Skipping row (${vals.length} cols): ${row.slice(0, 60)}`);
      continue;
    }
    const [
      id,
      raw_article_uid,
      status,
      name,
      category,
      source_url,
      provider,
      deadline_hints_raw,
      value_status,
      value_basis_hint,
      review_priority,
    ] = vals;

    const rawData = rawArticleMap.get(raw_article_uid) ?? {
      body_excerpt: "",
      outbound_links: [],
    };

    items.push({
      id,
      name,
      category,
      source_url,
      provider,
      deadline_hints: parseJsonArray(deadline_hints_raw),
      value_status,
      value_basis_hint,
      review_priority,
      status,
      source: "crawled",
      body_excerpt: rawData.body_excerpt,
      outbound_links: rawData.outbound_links,
    });
  }

  writeFileSync(outPath, JSON.stringify(items, null, 2), "utf-8");
  console.log(`✓ Converted ${items.length} crawled items → ${outPath}`);

  const withExcerpt = items.filter((i) => i.body_excerpt.length > 0).length;
  console.log(`  ${withExcerpt}/${items.length} items have body_excerpt`);
}

main();
