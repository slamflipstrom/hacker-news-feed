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

## How It Works

The server fetches stories from the Algolia HN Search API (`tags=story`) with:

- Time cutoff based on selected range
- Minimum score filter (`points > 10`)
- Retry + backoff for transient failures
- Multi-page fetch/dedupe before returning top results

Client-side controls then apply sort and hide-read filtering.

## Query Params

- `range`: `24h | 7d | 30d`
- `sort`: `top | new | comments`
- `hideRead`: `1` to show only unread stories
