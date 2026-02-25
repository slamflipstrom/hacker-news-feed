# Configurable Queue Size Preference

## Problem
The reading queue always shows 3 stories. Some users want a shorter queue (fewer obligations) and some want more stories to pick from (up to 10).

## Proposed UX
- Add a queue size setting: options 3 / 5 / 10, default 3
- Exposed in the header preference controls as a small segmented control ("Queue: 3 | 5 | 10")
- Persisted to a cookie so the server can respect it on load (same pattern as `sortMode` / `timeRange`)

## Files to Touch
- `src/lib/preferences.ts` — add `queueSize` type, default, encode/decode
- `src/routes/+page.server.ts` — read `queueSize` cookie, include in returned data
- `src/routes/+page.svelte` — pass `queueSize` to `QueueSection`
- `src/lib/features/feed/components/QueueSection.svelte` — accept and use `queueSize` prop
- `src/lib/features/feed/components/FeedHeader.svelte` — render queue size selector
