# Keyboard Filter Shortcuts (2026-02-23)

## Objective
Add keyboard shortcuts to change active feed filters without using mouse controls:
- One key toggles sort mode (`top` ↔ `comments`)
- One key cycles time range (`24h` → `7d` → `30d` → `24h`)

## Plan
- [x] Extend keyboard controller dependencies with filter actions.
- [x] Wire shortcut handlers in `src/routes/+page.svelte` to existing preference APIs.
- [x] Update visible shortcut hints/docs to include new keys.
- [x] Add/extend e2e coverage for new filter shortcuts.

## Verification
- [x] `pnpm typecheck` passes.
- [x] `pnpm test:e2e --grep "keyboard shortcuts work"` passes.

## Review
Status: Completed.

### What changed
- Added two new keyboard actions in `src/lib/features/feed/navigation.svelte.ts`:
  - `t` toggles sort mode
  - `r` cycles time range
- Added page-level handlers in `src/routes/+page.svelte` to:
  - toggle `top/comments` sort state via existing preference controller
  - cycle time ranges in configured order and trigger route navigation
  - reset active story index when filters change via shortcut
- Updated visible shortcut text in `src/lib/features/feed/components/KeyboardHint.svelte`.
- Updated shortcut docs in `README.md` and `AGENTS.md`.
- Extended keyboard smoke coverage in `e2e/smoke.spec.ts`.

### Verification notes
- `pnpm typecheck` reported 0 errors and 0 warnings.
- Keyboard e2e scenario passed in Chromium (`1 passed`).

---

# Dark Mode Implementation Plan

## Objective
Add a first-class dark mode with persistent user preference, no SSR/hydration flash, and full visual coverage across feed components.

## Decisions
- Implement `theme` modes as: `light | dark | system`.
- Default mode: `system` (follows OS preference when user has not explicitly chosen).
- Persist across URL, cookies, and localStorage using the same pattern as existing feed preferences.

## Plan
- [ ] Add theme preference types and helpers in `src/lib/preferences.ts`.
- [ ] Add storage/cookie keys for theme in `src/lib/preferences.ts` and reuse existing max-age behavior.
- [ ] Extend server preference resolution in `src/routes/+page.server.ts`:
  - Resolve theme from query param first, then cookie, then default.
  - Include resolved theme in `load` return data.
  - Set theme cookie on each request.
- [ ] Extend feed preference types/controller:
  - Update `src/lib/features/feed/types.ts` to include theme.
  - Update `src/lib/features/feed/preferences.svelte.ts` to hydrate/persist theme and keep URL query in sync.
- [ ] Add theme UI control in `src/lib/features/feed/components/FeedHeader.svelte`:
  - Add segmented control or button cycle for `Light`, `Dark`, `System`.
  - Ensure correct ARIA labels and active state semantics.
- [ ] Wire theme state in `src/routes/+page.svelte`:
  - Pass theme props/handlers into `FeedHeader`.
  - Apply selected theme to document root (`data-theme`) when preferences hydrate/change.
- [ ] Prevent theme flash on initial load:
  - Add an early inline script in `src/app.html` (or root layout head) that reads cookie/localStorage and sets `document.documentElement.dataset.theme` before app hydration.
  - Include `color-scheme` metadata/CSS to match active mode.
- [ ] Centralize color tokens and migrate component styles:
  - Introduce shared CSS variables for surface/text/border/accent states.
  - Replace hard-coded color values in:
    - `src/routes/+page.svelte`
    - `src/lib/features/feed/components/FeedHeader.svelte`
    - `src/lib/features/feed/components/StoryCard.svelte`
    - `src/lib/features/feed/components/StoryMeta.svelte`
    - `src/lib/features/feed/components/QueueSection.svelte`
    - `src/lib/features/feed/components/KeyboardHint.svelte`
    - `src/lib/features/feed/components/EmptyState.svelte`
- [ ] Add or update tests:
  - Extend `e2e/smoke.spec.ts` with theme toggle + persistence assertions.
  - Verify URL/query + cookie/localStorage behavior for theme.
- [ ] Update docs in `README.md` to include theme behavior and persistence details.

## Verification
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm test:e2e` passes.
- [ ] Manual validation in desktop and mobile widths:
  - Theme switches immediately without reload.
  - Theme persists across refresh/navigation.
  - No hydration/theme flicker on first paint.
  - Contrast and focus states remain accessible in both themes.

## Review
Status: Not started (planning only).

Expected outcome after implementation:
- Theme is consistent across SSR + client hydration.
- All major UI surfaces/components use theme tokens.
- Existing feed interactions (range/sort/hide-read/read/save/keyboard shortcuts) continue to work unchanged.

---

# Test Strategy Evaluation and Expansion (2026-02-23)

## Objective
Implement a balanced testing expansion:
- align e2e with the canonical sort contract (`top | comments`)
- add deterministic e2e coverage for persistence/fallback/queue behavior
- add unit tests for server/data utility logic

## Plan
- [x] Align `e2e/smoke.spec.ts` with current sort options and query expectations.
- [x] Add deterministic mock-server controls for error/empty responses.
- [x] Add `e2e/preferences-persistence.spec.ts`.
- [x] Add `e2e/server-fallback.spec.ts`.
- [x] Add `e2e/queue-behavior.spec.ts`.
- [x] Add Vitest unit test harness and scripts.
- [x] Add unit tests for `src/lib/preferences.ts`.
- [x] Add unit tests for `src/lib/features/feed/story-utils.ts`.
- [x] Add unit tests for `src/lib/hn-client.ts`.
- [x] Add unit tests for `src/routes/+page.server.ts`.
- [x] Update README sort/query docs to `top | comments`.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm test:unit`.
- [x] Run `pnpm test:e2e`.

## Review
Status: Completed.

### What changed
- Updated e2e smoke sort assertions to match canonical sort modes (`top`, `comments`) and UI label (`Most Discussed`).
- Added deterministic mock response mode controls in `e2e/mocks/algolia-server.mjs` via `GET /__mode?value=normal|empty|error500`.
- Added new e2e specs:
  - `e2e/preferences-persistence.spec.ts`
  - `e2e/server-fallback.spec.ts`
  - `e2e/queue-behavior.spec.ts`
- Added Vitest harness:
  - `package.json` scripts: `test:unit`, `test:unit:watch`
  - `vite.config.ts` test configuration
  - `vitest` dev dependency
- Added unit tests:
  - `src/lib/preferences.test.ts`
  - `src/lib/features/feed/story-utils.test.ts`
  - `src/lib/hn-client.test.ts`
  - `src/tests/page.server-load.test.ts`
- Updated docs in `README.md` to reflect supported sort/query contract (`top | comments`).

### Verification
- `pnpm typecheck` passed.
- `pnpm test:unit` passed (`23` tests).
- `pnpm test:e2e` passed (`9` tests, deterministic mock mode).

---

# CI Deploy Gate Setup (2026-02-23)

## Objective
Ensure `typecheck`, unit tests, and deterministic e2e run in CI and can be enforced as a required gate before Cloudflare production deploys.

## Plan
- [x] Add GitHub Actions workflow that runs `pnpm typecheck`, `pnpm test:unit`, and `pnpm test:e2e` on PRs and pushes to `main`.
- [x] Install Playwright Chromium in CI so e2e is runnable on GitHub-hosted runners.
- [x] Upload Playwright artifacts on failures for debugging.
- [x] Update README with explicit required-check gating steps for Cloudflare deploy safety.

## Review
Status: Completed.

### What changed
- Added workflow: `.github/workflows/ci.yml` (`CI` job `Typecheck + Unit + E2E`).
- Updated `README.md` with required-check setup instructions for `main`.

### Verification
- Workflow and README changes were validated via file inspection.
- No application runtime code was modified.

---

# Dark Mode P1 Remediation (2026-02-23)

## Objective
Address the P1 dark-mode gaps:
- enforce `theme` query precedence over cookie/default
- keep theme in URL state sync with other feed preferences
- eliminate first-paint mismatch by resolving theme before hydration with `color-scheme` support

## Plan
- [x] Update server preference resolution to apply `theme` as query param first, then cookie, then default.
- [x] Update layout theme resolution to mirror query-first behavior for SSR consistency.
- [x] Include `theme` in preference URL serialization and replacement logic.
- [x] Update pre-hydration script in `src/app.html` to resolve theme from query, then localStorage, then cookie.
- [x] Add `color-scheme` metadata and CSS behavior to align browser chrome with active theme.
- [x] Add/extend tests for theme precedence and persistence behavior.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm test:unit`.
- [ ] Run `pnpm test:e2e`.

## Review
Status: In progress.

---

# CI pnpm Version Hotfix (2026-02-23)

## Objective
Fix failing GitHub Actions setup step by providing an explicit pnpm version source.

## Plan
- [x] Set `version` for `pnpm/action-setup@v4` in `.github/workflows/ci.yml`.
- [x] Add `packageManager` pin in `package.json`.
- [x] Record the correction in `tasks/lessons.md`.

## Review
Status: Completed.

### Verification
- Workflow now contains `with: version: 10.30.0` for `pnpm/action-setup@v4`.
- `package.json` now includes `"packageManager": "pnpm@10.30.0"`.
