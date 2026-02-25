# First-Visit Onboarding Hint

## Problem
New users don't know about keyboard shortcuts (j/k, o, s, h, etc.) and have no prompt to discover them. The keyboard shortcuts section is hidden behind a toggle that many users never notice.

## Proposed UX
- On first visit, show a dismissible banner below the header: "Tip: use j/k to navigate, o to open, s to save. [Show shortcuts] [✕]"
- Store a `hn-rss-onboarding-seen` flag in localStorage on dismiss
- Never show again after dismissed

## Files to Touch
- `src/routes/+page.svelte` — read/write localStorage flag, pass `showOnboardingHint` state
- `src/lib/features/feed/components/FeedHeader.svelte` — render the banner (or create a standalone `OnboardingBanner.svelte` component)
