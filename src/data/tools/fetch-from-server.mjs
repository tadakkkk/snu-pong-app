import { writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "enriched-items.json");
const API_URL = "https://snu-pong-app.onrender.com/api/items";
const TIMEOUT_MS = 60_000;

function toEnrichedItem(item) {
  return {
    id: item.id,
    name: item.title,
    category: item.category,
    source_url: item.source_url,
    provider: item.source_name,
    estimated_value: item.estimated_value_krw ?? null,
    estimated_value_min: item.estimated_value_min_krw ?? null,
    estimated_value_max: item.estimated_value_max_krw ?? null,
    valuation_status: item.valuation_status ?? null,
    deadline_date: item.deadline_at ?? null,
    tags: item.tags ?? [],
    value_status: item.estimated_value_krw != null ? "estimated" : "needs_estimation",
    review_priority: "medium",
    deadline_hints: [],
    source: "crawled_enriched",
  };
}

async function main() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    console.log(`Fetching items from ${API_URL}...`);
    const response = await fetch(API_URL, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const enriched = data.map(toEnrichedItem);

    writeFileSync(OUTPUT_PATH, JSON.stringify(enriched, null, 2), "utf-8");
    console.log(`Wrote ${enriched.length} items to enriched-items.json`);
  } catch (error) {
    clearTimeout(timer);
    if (existsSync(OUTPUT_PATH)) {
      console.warn(`Fetch failed (${error.message}). Keeping existing enriched-items.json.`);
    } else {
      console.warn(`Fetch failed (${error.message}). No existing enriched-items.json to fall back to.`);
    }
  }
}

main();
