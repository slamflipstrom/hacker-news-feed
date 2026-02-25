# Copy Link Button per Story Card

## Problem
Users who want to share a story URL have to open the story in a new tab and copy from there. There's no in-app shortcut to grab the URL.

## Proposed UX
- Small "copy" icon button on each StoryCard (visible on hover / always visible on touch devices)
- Clicking it runs `navigator.clipboard.writeText(story.url)`
- Button label changes to "Copied!" for ~2 seconds, then reverts

## Files to Touch
- `src/lib/features/feed/components/StoryCard.svelte` — add copy button with local `copied` state
- No prop changes required (story URL is already available in the component)
