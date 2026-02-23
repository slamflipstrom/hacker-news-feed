# HN-RSS

A focused SvelteKit reader for high-signal Hacker News stories.

## Features

- Top **20** stories in `24h`, `7d`, or `30d` windows
- Sorting modes: `Top`, `Most Discussed`
- Read flow UX: queue, read/save state, and quick actions (`Open`, `Save`, `Skip`)
- Keyboard shortcuts: `j/k` navigate, `o` open, `c` comments, `s` save, `m` mark read, `t` toggle sort, `r` cycle range
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
- `pnpm cf:build` (Cloudflare Pages build output)
- `pnpm cf:preview` (local Cloudflare Pages runtime preview)

## How It Works

The server fetches stories from the Algolia HN Search API (`tags=story`) with:

- Time cutoff based on selected range
- Minimum score filter (`points > 10`)
- Retry + backoff for transient failures
- Multi-page fetch/dedupe before returning top results

Client-side controls then apply sort and hide-read filtering.

## Feed Architecture

The feed UI is split into a feature-oriented structure under:

- `./src/lib/features/feed/components`
- `./src/lib/features/feed/*.svelte.ts`
- `./src/lib/features/feed/story-utils.ts`

Route responsibilities:

- `./src/routes/+page.server.ts` handles data loading and preference resolution
- `./src/routes/+page.svelte` is an orchestration container only

Feature responsibilities:

- Components in `./src/lib/features/feed/components` handle presentation
- Controllers in `.svelte.ts` files manage page-scoped reactive state for preferences, read/saved story state, and keyboard navigation
- `./src/lib/features/feed/story-utils.ts` contains pure helper functions for sorting and story metadata/link handling

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

### GitHub Required Check Gate

This repo includes GitHub Actions workflow `CI` at `./.github/workflows/ci.yml` that runs:

- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm test:e2e` (deterministic mock mode)

## Cloudflare Deployment

This project targets Cloudflare Pages + Functions via `@sveltejs/adapter-cloudflare`.

### Why this adapter

- Native Pages/Workers runtime compatibility
- Edge-executed server routes (`+page.server.ts`) without Node server management
- Consistent SvelteKit output directory for Cloudflare deploys: `.svelte-kit/cloudflare`

### Local validation before deploy

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test:e2e
pnpm cf:build
pnpm cf:preview
```

### Cloudflare Pages project settings

- Framework preset: `SvelteKit`
- Build command: `pnpm build`
- Build output directory: `.svelte-kit/cloudflare`
- Deploy command: _(leave empty / unset)_
- Production branch: `main`
- Node version: `20` or newer
- Preview deploys: enabled for non-`main` branches

For Git-integrated Pages deploys, do **not** set a custom deploy command such as
`npx wrangler deploy`. Pages automatically deploys the build output.

### Cloudflare config in repo

`wrangler.toml` is configured with:

- `compatibility_date = "2026-02-22"`
- `compatibility_flags = ["nodejs_als"]`
- `pages_build_output_dir = ".svelte-kit/cloudflare"`

### Custom domain and launch

1. Add your domain to Cloudflare DNS.
2. Attach that domain under Pages custom domains.
3. Wait for SSL status to become active.
4. Because this is first-time deployment, cut over directly after validation.

### Post-launch checks

- Confirm `Cache-Control` headers on SSR responses.
- Verify preference cookies are set (`range`, `sort`, `hideRead`).
- Enable Pages/Workers logs and alerts for elevated `5xx` rates.

## Query Params

- `range`: `24h | 7d | 30d`
- `sort`: `top | comments`
- `hideRead`: `1` to show only unread stories
