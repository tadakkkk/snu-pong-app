# NOTE
**This work is done**

# Onboarding Personalization Implementation TODO

This file reflects the current project state as of the latest implementation pass.

## Current State

Already implemented:

- `src/app/onboarding/page.tsx` has personalization steps after tuition/scholarship:
  - consent step;
  - input-method selection;
  - predefined question flow;
  - placeholder screens for file/chat input;
  - final result screen notice when personalization was saved.
- `src/data/personalization_questions.ts` defines structured question data and maps selected options to tag strings.
- `src/lib/personalization/buildInterestVector.ts` converts question answers into a weighted `interestTagVector`.
- `src/store/user.ts` stores:
  - `personalizationEnabled`;
  - `personalizationInputMethod`;
  - `personalizationConsentAt`;
  - `interestTagVector`;
  - `personalizationAnswers`;
  - `personalizationSummary`;
  - `personalizationUpdatedAt`.
- Supabase login and cloud sync now exist through `src/lib/supabase/sync.ts` and `src/components/SupabaseSync.tsx`.
- The server item API now exposes `tags` from `benefit_items`, and `/api/items` supports the `only_benefits` filter.

Important current limitation:

- `useUserStore` is now in-memory, not Zustand-persisted. Logged-in users can sync through Supabase `user_data.profile`; guest users can currently finish onboarding in memory but may lose data on refresh. Do not assume the old `snu-pong-user` localStorage persistence still exists except for legacy migration.

## Implementation Direction

Use the current Supabase `user_data.profile` JSON as the immediate user-data storage layer.

Do not create a second frontend-only persistence model unless it is explicitly for guest mode. The server-side `user_interest_profiles` table from the larger blueprint can wait until the Python recommendation server has authenticated user identity or a clear bridge from Supabase user IDs.

The next implementation should focus on these practical pieces:

1. make personalized recommendations actually affect visible item ranking;
2. make personalization data durable for the supported user modes;
3. add edit/reset/delete controls after onboarding;
4. replace file/chat placeholders with controlled input flows only after privacy behavior is decided.

## 1. Recommendation Data Fetching

The app currently uses static `src/data/items.ts` in `src/app/pong/page.tsx` and in the onboarding result screen.

Now that the server exposes tags, add a client-side API helper:

- `src/lib/items/fetchBenefitItems.ts`

Suggested behavior:

```ts
export type ServerBenefitItem = {
  id: string;
  title: string;
  source_name: string;
  source_url: string;
  category: string;
  estimated_value_krw: number | null;
  deadline_at: string | null;
  updated_at: string;
  tags: string[];
};

export async function fetchBenefitItems(options?: {
  onlyBenefits?: boolean;
  category?: string;
}): Promise<ServerBenefitItem[]> {
  ...
}
```

Use `/api/items?only_benefits=true` when server base URL is configured.

Because the frontend is deployed on Vercel and the Python server may be deployed elsewhere, add an environment variable:

- `NEXT_PUBLIC_SERVER_API_BASE_URL`

Fallback behavior:

- if the env var is missing;
- if the server request fails;
- if the response is malformed;

then keep using local `src/data/items.ts`.

## 2. Client-side Scoring for First Integration

Add a lightweight scoring helper before building a full server recommendation endpoint:

- `src/lib/personalization/recommendItems.ts`

Inputs:

- server benefit items or local items converted into a common shape;
- `interestTagVector` from `useUserStore`;
- ponged/completed item IDs;
- current date.

Output:

```ts
export type RecommendedItem<T> = {
  item: T;
  score: number;
  matchedTags: string[];
  reason: string;
};
```

Scoring formula:

```text
score =
  0.60 * tag_match_score
+ 0.25 * value_score
+ 0.15 * deadline_score
```

Rules:

- `tag_match_score`: sum of matched user tag weights / sum of all user tag weights.
- `value_score`: normalize estimated value and cap outliers.
- `deadline_score`: higher for upcoming deadlines, zero for expired/no deadline.
- exclude or downrank already ponged items.
- if `interestTagVector` is empty, do not show "personalized" ranking.

This should be shared by:

- `src/app/pong/page.tsx` personalized section;
- onboarding `StepResult`;
- future settings preview.

## 3. Update `/pong` Personalized Section

Current `/pong` personalized section only uses broad `user.interests` categories and ignores `interestTagVector`.

Change it to:

1. read `user.personalizationEnabled` and `user.interestTagVector`;
2. fetch server items with tags when possible;
3. score items with `recommendItems`;
4. render the top 4-6 recommendations;
5. show matched tags or a short reason under the title;
6. fall back to the existing broad-category section if no tag vector/server tags exist.

Do not remove the existing category grid or static fallback. The app still needs to work without the Python server.

## 4. Update Onboarding Result Screen

Current `StepResult` only says the personalized interest was saved. It does not use the tag vector for item ranking.

Implementation:

1. pass `interestTagVector` into `StepResult`;
2. load server tagged items if possible;
3. rank them with `recommendItems`;
4. show top recommended items with matched tags;
5. while loading, keep the current static result UI;
6. on failure, keep the current static result UI.

Do not block onboarding completion on the recommendation fetch.

## 5. Persistence Rules

Logged-in users:

- `pushToCloud()` already writes `profile` to Supabase `user_data`;
- `pullFromCloud()` already restores `profile`;
- personalization fields are included automatically because `getSnapshot()` serializes the whole user store minus functions.

Guest users:

- decide one of these two paths before further UX work:
  - restore local persistence for guest users only; or
  - make it clear that "로그인 없이 둘러보기" is temporary and cannot preserve personalization after refresh.

Recommended path:

- add a small guest persistence layer, not full Zustand persist:
  - save `useUserStore`, semester store, and pong records to localStorage only when there is no Supabase user;
  - clear or migrate it on login using the existing legacy migration logic;
  - keep the current Supabase cloud data as source of truth for logged-in users.

Update testing instructions accordingly. The old instruction to inspect `localStorage["snu-pong-user"]` is no longer valid after the store stopped using Zustand persist.

## 6. Post-onboarding Edit/Delete/Reinitialize

Add a personalization settings surface.

Preferred location:

- if there is already a settings sheet/page, add a "맞춤 추천" section there;
- otherwise create `src/app/settings/personalization/page.tsx` later.

Minimum controls:

- show current enabled/disabled state;
- show current interest tags sorted by weight;
- allow removing a tag;
- allow changing tag strength with a simple 3-step control: 낮음 / 보통 / 높음;
- allow rerunning the onboarding question step;
- allow disabling personalization while keeping data;
- allow deleting personalization data entirely.

Data behavior:

- edit updates `interestTagVector`, `personalizationUpdatedAt`, and `personalizationSummary`;
- disable sets `personalizationEnabled = false` but keeps vector/answers;
- delete clears vector, answers, summary, consent timestamp, and sets method to `skip`;
- reinitialize routes to the personalization question flow and replaces the vector on completion.

After each action:

- call `setProfile()`;
- call `pushToCloud()` if logged in;
- update local guest persistence if guest persistence is added.

## 7. File Input Flow

Do not implement real file upload until privacy/storage behavior is explicit.

When implementing it:

1. accept only a narrow file set first, probably `.pdf` and plain text;
2. show explicit consent before upload;
3. send the file/text to a server endpoint that extracts a summary and tag candidates;
4. do not store the raw file by default;
5. store only:
   - extracted tags;
   - confidence;
   - short evidence summary;
   - timestamp;
   - input source = `uploaded_file`;
6. merge extracted tags into `interestTagVector`;
7. ask predefined/chat follow-up questions only for fields that the file did not cover.

Suggested future endpoint:

- `POST /api/me/interest-profile/extract-file`

Until that exists, keep the file option as a placeholder.

## 8. Chat Input Flow

When implementing chat-based personalization:

1. use a short guided conversation, not open-ended chat forever;
2. ask for interests, goals, preferred activity style, constraints, and fields;
3. after each user message, extract candidate tags from the same canonical tag pool;
4. show the extracted tags to the user before saving;
5. save the final vector only after confirmation.

Storage:

- avoid storing full chat logs by default;
- store a short `personalizationSummary`;
- store an event-like record in cloud/server only if the backend schema supports it.

Suggested future endpoint:

- `POST /api/me/interest-profile/extract-chat`

Until that exists, keep the chat option as a placeholder.

## 9. Canonical Tag Pool

The canonical recommendation vocabulary is already decided:

- activity tags: 100 tags;
- domain tags: 150 tags;
- total: 250 tags;
- current Python source: `src/server/tag_pool.py`.

Do not invent new onboarding tags outside this pool.

Important product decision:

- keep the existing broad onboarding question, "어떤 걸 누리고 싶어?", as-is;
- that question can continue to use broad app categories such as learning/career/welfare/etc.;
- do not force that broad question to become the 250-tag survey;
- the 250-tag vocabulary applies to the later personalization survey and recommendation vector.

Implementation approach:

1. Keep `StepInterests` in `src/app/onboarding/page.tsx` unchanged unless design/product asks for copy or UI changes.
2. Treat `src/data/personalization_questions.ts` as the first user-facing survey that must map into the 250-tag pool.
3. Audit every `tags` array in `personalization_questions.ts` against `src/server/tag_pool.py`.
4. If an option cannot be represented by existing tags, rewrite the option wording or map it to the nearest valid activity/domain tags. Do not add one-off tags.
5. Prefer each selected survey option to include:
   - 1-3 activity tags from `ACTIVITY_TAGS`;
   - 0-3 domain tags from `DOMAIN_TAGS`, only when the option clearly describes a field.
6. Keep the generated `interestTagVector` as weighted tags from this 250-tag pool only.
7. Run the local validation check so future edits fail when `personalization_questions.ts` uses tags missing from `src/server/tag_pool.py`.

Implemented validation utility:

- `src/data/tools/validate-personalization-tags.ts`
- `npm run validate-personalization-tags`

The validator currently checks:

- `ACTIVITY_TAGS` has exactly 100 tags;
- `DOMAIN_TAGS` has exactly 150 tags;
- no duplicate tags exist across the combined pool;
- every tag in `personalization_questions.ts` exists in the pool;
- each survey option stays within 1-3 activity tags and 0-3 domain tags where applicable.

Longer-term cleanup:

- choose one canonical machine-readable tag source after the team agrees on ownership;
- until then, keep `src/server/tag_pool.py` as the practical source of truth because the enrichment prompt already imports it;
- generate or manually mirror a frontend tag list only for validation/autocomplete, not for redefining the vocabulary.

## 10. Server Recommendation Endpoint

After client-side scoring works, add a server endpoint so recommendation logic can move out of the browser.

Suggested endpoint:

- `POST /api/recommendations/preview`

Request:

```json
{
  "interest_vector": {
    "#인공지능": { "weight": 1, "confidence": 0.8, "source": ["onboarding_question"] }
  },
  "exclude_item_ids": ["..."],
  "limit": 10
}
```

Response:

```json
{
  "items": [
    {
      "item": { "...": "BenefitItemSummary" },
      "score": 0.82,
      "matched_tags": ["#인공지능", "#인턴십"],
      "reason": "AI/SW 관심사와 인턴십 태그가 맞습니다."
    }
  ]
}
```

This endpoint does not need login, so it can be implemented before full authenticated user-profile APIs.

Later authenticated endpoint:

- `GET /api/me/recommendations`

This one should use the logged-in user's stored profile.

## 11. Supabase/User Data Contract

Current cloud storage shape:

- Supabase table: `user_data`;
- primary key: `user_id`;
- profile JSON contains the entire `useUserStore` data;
- semesters and pong records are stored separately in the same row.

Before adding more profile fields, document the expected `profile` JSON shape in a shared place:

- `src/lib/supabase/USER_DATA_CONTRACT.md`, or
- `src/app/onboarding/TODO.md` until a better doc exists.

Fields that must be preserved by collaborators:

- `personalizationEnabled`;
- `personalizationInputMethod`;
- `personalizationConsentAt`;
- `interestTagVector`;
- `personalizationAnswers`;
- `personalizationSummary`;
- `personalizationUpdatedAt`.

Do not rename these without migration logic.

## 12. Immediate Implementation Order

Recommended next coding order:

1. Add `src/lib/personalization/recommendItems.ts`.
2. Add tests or a small local verification for scoring behavior.
3. Add `src/lib/items/fetchBenefitItems.ts` with static fallback.
4. Update `/pong` personalized section to use tag-vector recommendations.
5. Update onboarding `StepResult` to preview tag-vector recommendations.
6. Decide and implement guest persistence behavior.
7. Add personalization edit/delete/reinitialize UI.
8. Only then replace file/chat placeholders with real flows.

Keep every step usable without the Python server and without logged-in Supabase state. The prototype should degrade to static items and broad categories instead of breaking.
