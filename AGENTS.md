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

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here’s how to use the available tools effectively:

Available Svelte MCP Tools:

1. list-sections
   Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths. When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

2. get-documentation
   Retrieves full documentation content for specific sections. Accepts single or multiple sections. After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user’s task.

3. svelte-autofixer
   Analyzes Svelte code and returns issues and suggestions. You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

4. playground-link
   Generates a Svelte Playground link with the provided code. After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
