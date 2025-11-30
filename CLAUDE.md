# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HN-RSS is a SvelteKit application that fetches and displays the top 10 Hacker News stories filtered by time range (1h, 24h, 7d, 30d). The app uses the Algolia HN Search API to retrieve and filter stories based on recency and score. Built with Svelte 5 using runes syntax.

## Development Commands

This project uses `pnpm` as the package manager.

- **Start dev server**: `pnpm dev`
- **Build for production**: `pnpm build`
- **Preview production build**: `pnpm preview`
- **Type checking**: `pnpm check`
- **Type checking (watch mode)**: `pnpm check:watch`

## Architecture

### SvelteKit Structure

- **Svelte Version**: Svelte 5 with runes syntax (`$props()`, `$effect()`, snippet rendering)
- **Routes**: Uses SvelteKit's file-based routing in `src/routes/`
  - `+page.server.ts` handles server-side data loading with `TimeRange` query param, returns stories array, timeRange, and loadedAt timestamp
  - `+page.svelte` renders the main UI using Svelte 5 runes syntax
  - `+layout.svelte` provides app-wide layout with favicon injection

### Hacker News API Client (`src/lib/hn-client.ts`)

The core logic for fetching HN stories using the Algolia HN Search API:

- **`getStoriesInTimeRange(timeRange, limit)`**: Main function that:
  1. Calculates timestamp cutoff based on time range
  2. Queries Algolia API with `/search` endpoint
  3. Applies numeric filters: `created_at_i > timeLimit` and `points > 10` (minimum 10 points)
  4. Fetches 10x the limit (capped at 1000 max) to ensure high-quality results
  5. Sorts by points descending and returns top N stories
  6. Includes extensive console logging for debugging

**Time ranges**: `1h` (3600s), `24h` (86400s), `7d` (604800s), `30d` (2592000s)

**API**: Uses `https://hn.algolia.com/api/v1/search` with `tags=story` filter and numeric filters for time range and minimum points

### Data Flow

1. User navigates to page with optional `?range={timeRange}` query param
2. `+page.server.ts` loads stories via `getStoriesInTimeRange()` (defaults to 24h, fetches 10 stories)
3. Single API call to Algolia with timestamp filter (`created_at_i > timeLimit`) and minimum points filter (`points > 10`)
4. Algolia returns up to 10x requested stories (capped at 1000)
5. Results sorted by points descending and limited to top 10
6. Server returns `{ stories, timeRange, loadedAt }` to client
7. Svelte 5 component renders stories using `$props()` and `$effect()` runes
8. User can click time range buttons to reload with different filters (uses SvelteKit navigation with `data-sveltekit-noscroll`)

### Key TypeScript Interfaces

- **`HNStory`**: Story object with objectID, title, url, points, author, created_at_i, num_comments
- **`TimeRange`**: Union type of valid time range strings ("1h" | "24h" | "7d" | "30d")
- **`AlgoliaResponse`**: Internal interface wrapping hits array from Algolia API

### UI Features (`+page.svelte`)

- **Svelte 5 Runes**: Uses modern Svelte 5 syntax
  - `$props()` for reactive component props
  - `$effect()` for side effects and debugging
  - Snippet rendering with `{@render children?.()}`
- **Time Range Selector**: Interactive buttons for 1h, 24h, 7d, 30d filters
- **Story List**: Ranked list (1-10) with:
  - Story title linking to external URL (or HN discussion if no URL)
  - Points (score) displayed prominently in orange
  - Author name
  - Relative time formatting (e.g., "3h ago", "2d ago")
  - Comment count linking to HN discussion
- **Responsive Design**: Mobile-friendly layout with flexbox
- **Styling**: Custom CSS with HN orange (#ff6600) accent color, hover effects

## Tech Stack

- **Framework**: SvelteKit 2.x
- **UI Library**: Svelte 5.x (using runes syntax)
- **Package Manager**: pnpm
- **TypeScript**: Full type safety throughout
- **Build Tool**: Vite 7.x
- **Adapter**: @sveltejs/adapter-auto (auto-detects deployment platform)
- **API**: Algolia HN Search API (https://hn.algolia.com/api/v1/)

## File Structure

```
src/
├── lib/
│   ├── assets/          # Static assets (favicon, etc.)
│   └── hn-client.ts     # Algolia API client
├── routes/
│   ├── +layout.svelte   # Root layout with favicon
│   ├── +page.svelte     # Main UI component (Svelte 5)
│   └── +page.server.ts  # Server-side data loading
└── app.d.ts             # TypeScript declarations
```

## MCP

### Svelte MCP

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

### Available MCP Tools:

#### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

#### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

#### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

#### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
