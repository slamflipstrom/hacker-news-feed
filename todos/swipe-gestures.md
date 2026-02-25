# Swipe Gestures on StoryCard

## Problem
Mobile users have no quick way to dismiss or save stories. Every action requires tapping small buttons, making one-handed use awkward.

## Proposed UX
- Swipe left on a StoryCard → mark as read / skip (same as `m` keyboard shortcut)
- Swipe right on a StoryCard → save / unsave (same as `s` keyboard shortcut)
- Show a subtle colored indicator at the edge as the user drags (red for skip, green for save)
- Snap back if the swipe is cancelled; commit the action if threshold (~40% card width) is reached

## Files to Touch
- `src/lib/features/feed/components/StoryCard.svelte` — add touch event handlers and drag state
- `src/routes/+page.svelte` — pass `onMarkRead` and `onToggleSave` callbacks down (already present on StoryList → StoryCard)
