# Lessons

## 2026-02-23
- When adding GitHub Actions with `pnpm/action-setup@v4`, always provide a pnpm version source (`with.version` in workflow and/or `packageManager` in `package.json`) or CI will fail before dependency install.
- When protecting global keyboard shortcuts from focused interactive controls, do not blanket-disable navigation keys (`j/k`); allow intended global navigation keys while still preserving native activation keys like `Enter`.
