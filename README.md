# HN-RSS

A focused SvelteKit reader for high-signal Hacker News stories.

## Features

- Top **20** stories in `24h`, `7d`, or `30d` windows
- Sorting modes: `Top`, `Newest`, `Most Commented`
- Read flow UX: queue, read/save state, and quick actions (`Open`, `Save`, `Skip`)
- Keyboard shortcuts: `j/k` navigate, `o` open, `c` comments, `s` save, `m` mark read
- Persistent preferences (`range`, `sort`, `hideRead`) across visits
- Mobile-friendly UI

## Quick Start

```sh
pnpm install
pnpm dev
```

Other useful commands:

- `pnpm typecheck`
- `pnpm build`
- `pnpm preview`
- `pnpm test:e2e` (deterministic mock Algolia data)
- `pnpm test:e2e:live` (opt-in real Algolia API)

## How It Works

The server fetches stories from the Algolia HN Search API (`tags=story`) with:

- Time cutoff based on selected range
- Minimum score filter (`points > 10`)
- Retry + backoff for transient failures
- Multi-page fetch/dedupe before returning top results

Client-side controls then apply sort and hide-read filtering.

## End-to-End Testing

Playwright is deterministic by default. `pnpm test:e2e` starts:

- A local mock Algolia server (`http://127.0.0.1:8787`)
- The app server with `HN_API_BASE_URL` pointed at that mock

Live Algolia is opt-in via `pnpm test:e2e:live` and is not intended as a required CI gate.

### Environment Variables

- `HN_API_BASE_URL`: Overrides the Algolia API base URL used by the server (defaults to `https://hn.algolia.com/api/v1`)
- `E2E_USE_LIVE=1`: Playwright toggle that skips the mock server and uses real Algolia

### CI Recommendation

Use deterministic e2e as the required check:

```sh
pnpm install --frozen-lockfile
pnpm test:e2e
```

Keep live mode optional/manual for diagnostics:

```sh
pnpm test:e2e:live
```

## Query Params

- `range`: `24h | 7d | 30d`
- `sort`: `top | new | comments`
- `hideRead`: `1` to show only unread stories
