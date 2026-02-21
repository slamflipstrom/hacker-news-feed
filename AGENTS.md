# AGENTS.md

This file provides guidance to coding agents working in this repository.

## Project Overview

HN-RSS is a SvelteKit app that fetches high-signal Hacker News stories and helps users actually read them.

- Fetches up to **20 stories** in selected time windows: `24h`, `7d`, `30d`
- Uses Algolia HN Search API with filters: `created_at_i > cutoff` and `points > 10`
- Supports sorting (`top`, `new`, `comments`) and hiding read stories
- Includes persistent read/saved state and keyboard-driven navigation

## Development Commands

This project uses `pnpm`.

- `pnpm dev` starts the dev server
- `pnpm build` builds for production
- `pnpm preview` previews the production build
- `pnpm typecheck` runs `svelte-check`
- `pnpm check:watch` runs `svelte-check` in watch mode

## Architecture

### Route Structure

- `src/routes/+page.server.ts`
  - Resolves preferences from query params first, then cookies, then defaults
  - Loads stories with `getStoriesInTimeRange(timeRange, 20)`
  - Returns `{ stories, timeRange, sortMode, hideRead, storiesLimit, error }`
  - Sets `Cache-Control` by time range and stores preference cookies
- `src/routes/+page.svelte`
  - Renders filters, queue, story cards, and keyboard hints
  - Persists read/saved IDs in `localStorage`
  - Persists preference state in `localStorage`, URL query, and cookies
  - Implements keyboard shortcuts: `j/k` navigate, `o` open, `c` comments, `s` save, `m` mark read
- `src/routes/+layout.svelte`
  - App shell and favicon wiring

### Data Modules

- `src/lib/hn-client.ts`
  - API client for Algolia HN Search
  - Retries transient failures with exponential backoff
  - Fetches multiple pages (`hitsPerPage=200`, up to 5 pages) to improve result quality
  - Dedupes by `objectID`, sorts by points, and returns top `limit`
- `src/lib/preferences.ts`
  - Defines sort modes and defaults
  - Provides validation and encode/decode helpers for preference values
  - Centralizes storage/cookie keys

### Query Parameters

- `range`: `24h | 7d | 30d`
- `sort`: `top | new | comments`
- `hideRead`: `1` to hide read stories (absent means show all)

## Key Types

- `HNStory` in `src/lib/hn-client.ts`
- `TimeRange` in `src/lib/hn-client.ts`
- `SortMode` in `src/lib/preferences.ts`

## UI Behavior Notes

- “Today’s Queue” shows the first 3 visible stories plus read progress
- Story cards include quick actions: `Open`, `Save`, `Skip`
- Story metadata is optimized for scanning (domain/favicons + compact badges)
- Read and saved state is local to browser/device (no backend sync)

## Tech Stack

- Svelte 5 (runes)
- SvelteKit 2
- TypeScript
- Vite 7
- pnpm
- Algolia HN Search API

## File Structure

```
src/
├── lib/
│   ├── assets/
│   ├── hn-client.ts
│   └── preferences.ts
└── routes/
    ├── +layout.svelte
    ├── +page.server.ts
    └── +page.svelte
```

## MCP

### Svelte MCP (when available in the current session)

If the Svelte MCP server is available, use it for Svelte/SvelteKit documentation and autofix workflows.

#### 1. `list-sections`

Use first to discover documentation sections and relevant paths.

#### 2. `get-documentation`

Fetch all relevant sections after reviewing `list-sections` output.

#### 3. `svelte-autofixer`

Run when editing Svelte files; iterate until no actionable issues remain.

#### 4. `playground-link`

Only generate after user asks for it, and not when code was written directly to project files.
