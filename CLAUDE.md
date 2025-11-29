# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HN-RSS is a SvelteKit application that fetches and displays Hacker News stories filtered by time range (1h, 24h, 7d, 30d). The app uses the official Hacker News Firebase API to retrieve top stories and filter them based on recency and score.

## Development Commands

This project uses `pnpm` as the package manager.

- **Start dev server**: `pnpm dev`
- **Build for production**: `pnpm build`
- **Preview production build**: `pnpm preview`
- **Type checking**: `pnpm check`
- **Type checking (watch mode)**: `pnpm check:watch`

## Architecture

### SvelteKit Structure

- **Routes**: Uses SvelteKit's file-based routing in `src/routes/`
  - `+page.server.ts` handles server-side data loading with `TimeRange` query param
  - `+page.svelte` renders the main UI
  - `+layout.svelte` provides app-wide layout

### Hacker News API Client (`src/lib/hn-client.ts`)

The core logic for fetching HN stories using the Algolia HN Search API:

- **`getStoriesInTimeRange(timeRange, limit)`**: Main function that:
  1. Calculates timestamp cutoff based on time range
  2. Queries Algolia API with `search_by_date` endpoint
  3. Applies numeric filters: `created_at_i > timeLimit` and `points > 0`
  4. Fetches 5x the limit to ensure high-quality results
  5. Sorts by points descending and returns top N stories

**Time ranges**: `1h` (3600s), `24h` (86400s), `7d` (604800s), `30d` (2592000s)

**API**: Uses `https://hn.algolia.com/api/v1/search_by_date` with tags=story filter

### Data Flow

1. User navigates to page with optional `?range={timeRange}` query param
2. `+page.server.ts` loads stories via `getStoriesInTimeRange()` (defaults to 24h)
3. Single API call to Algolia with timestamp and score filters
4. Results sorted by points and limited to top 10
5. Stories rendered with metadata (points, author, time, comments)

### Key TypeScript Interfaces

- **`HNStory`**: Story object with objectID, title, url, points, author, created_at_i, num_comments
- **`TimeRange`**: Union type of valid time range strings ("1h" | "24h" | "7d" | "30d")
- **`AlgoliaResponse`**: Internal interface wrapping hits array

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
