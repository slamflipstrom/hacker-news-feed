# HN-RSS

A clean, fast SvelteKit app for browsing top Hacker News stories filtered by time range.

## Features

- **Time-filtered stories**: View top stories from the past 24 hours, 7 days, or 30 days
- **Ranked by score**: Displays the top 20 stories sorted by points (minimum 10 points)
- **Direct links**: Click through to story URLs or HN discussions
- **Responsive design**: Works seamlessly on mobile and desktop

## Tech Stack

- **Svelte 5** with runes syntax
- **SvelteKit 2** for server-side rendering
- **Algolia HN Search API** for real-time story data
- **TypeScript** for type safety
- **pnpm** for package management

## Development

Install dependencies:

```sh
pnpm install
```

Start the dev server:

```sh
pnpm dev
```

Build for production:

```sh
pnpm build
```

Preview production build:

```sh
pnpm preview
```

## How It Works

The app queries the Algolia HN Search API with timestamp and score filters to fetch recent stories. Stories are sorted by points and limited to the top 20 results. The time range can be adjusted using the filter buttons in the UI.
