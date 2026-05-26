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
}

function extractRows(sql: string): string[] {
  const insertIdx = sql.indexOf("INSERT INTO snuc_benefit_item_drafts");
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

function parseValues(row: string): string[] {
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
      // skip ::jsonb, ::text, etc.
      while (i < row.length && row[i] !== ",") i++;
      values.push(str);
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

function main() {
  const sqlPath = resolve(
    process.cwd(),
    "src/data/crawled/snuc_notice_sample_database.sql"
  );
  const outPath = resolve(process.cwd(), "src/data/crawled-items.json");

  const sql = readFileSync(sqlPath, "utf-8");
  const rows = extractRows(sql);

  const items: CrawledItem[] = [];
  for (const row of rows) {
    const vals = parseValues(row);
    if (vals.length < 11) {
      console.warn(`Skipping row (${vals.length} cols): ${row.slice(0, 60)}`);
      continue;
    }
    const [
      id,
      ,
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
    });
  }

  writeFileSync(outPath, JSON.stringify(items, null, 2), "utf-8");
  console.log(`✓ Converted ${items.length} crawled items → ${outPath}`);
}

main();
