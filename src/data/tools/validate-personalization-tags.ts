import { readFileSync } from "fs";
import { resolve } from "path";
import { personalizationQuestions } from "../personalization_questions";

const PROJECT_ROOT = resolve(__dirname, "../../..");
const SERVER_TAG_POOL_PATH = resolve(PROJECT_ROOT, "src/server/tag_pool.py");
const EXPECTED_ACTIVITY_COUNT = 100;
const EXPECTED_DOMAIN_COUNT = 150;

function extractArrayBlock(source: string, variableName: string): string {
  const startPattern = `${variableName} = [`;
  const start = source.indexOf(startPattern);
  if (start === -1) {
    throw new Error(`Could not find ${variableName} in ${SERVER_TAG_POOL_PATH}`);
  }

  const blockStart = source.indexOf("[", start);
  let depth = 0;
  for (let i = blockStart; i < source.length; i++) {
    const char = source[i];
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(blockStart, i + 1);
      }
    }
  }
  throw new Error(`Could not parse ${variableName} array block`);
}

function extractTags(source: string, variableName: string): string[] {
  const block = extractArrayBlock(source, variableName);
  return [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

function countTags(optionTags: string[], pool: Set<string>): number {
  return optionTags.filter((tag) => pool.has(tag)).length;
}

function main() {
  const serverTagPoolSource = readFileSync(SERVER_TAG_POOL_PATH, "utf-8");
  const activityTags = extractTags(serverTagPoolSource, "ACTIVITY_TAGS");
  const domainTags = extractTags(serverTagPoolSource, "DOMAIN_TAGS");
  const activityTagSet = new Set(activityTags);
  const domainTagSet = new Set(domainTags);
  const tagPool = new Set([...activityTags, ...domainTags]);

  const errors: string[] = [];
  const warnings: string[] = [];

  if (activityTags.length !== EXPECTED_ACTIVITY_COUNT) {
    errors.push(`ACTIVITY_TAGS count is ${activityTags.length}, expected ${EXPECTED_ACTIVITY_COUNT}`);
  }
  if (domainTags.length !== EXPECTED_DOMAIN_COUNT) {
    errors.push(`DOMAIN_TAGS count is ${domainTags.length}, expected ${EXPECTED_DOMAIN_COUNT}`);
  }
  if (tagPool.size !== activityTags.length + domainTags.length) {
    errors.push("Duplicate tags found across ACTIVITY_TAGS and DOMAIN_TAGS");
  }

  for (const question of personalizationQuestions) {
    for (const option of question.options) {
      const location = `${question.id}.${option.id}`;
      const unknownTags = option.tags.filter((tag) => !tagPool.has(tag));
      if (unknownTags.length > 0) {
        errors.push(`${location} uses tags outside TAG_POOL: ${unknownTags.join(", ")}`);
      }

      const activityCount = countTags(option.tags, activityTagSet);
      const domainCount = countTags(option.tags, domainTagSet);
      if (activityCount > 3) {
        errors.push(`${location} has ${activityCount} activity tags; keep each option to 1-3 activity tags`);
      }
      if (domainCount > 3) {
        errors.push(`${location} has ${domainCount} domain tags; keep each option to 0-3 domain tags`);
      }
      if (option.tags.length === 0) {
        errors.push(`${location} has no tags`);
      }
      if (question.id !== "domain" && activityCount === 0) {
        warnings.push(`${location} has no activity tag`);
      }
    }
  }

  for (const warning of warnings) {
    console.warn(`warning: ${warning}`);
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`error: ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Validated personalization tags: ${activityTags.length} activity, ${domainTags.length} domain, ${tagPool.size} total`,
  );
}

main();
