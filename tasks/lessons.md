# Lessons

## 2026-02-23
- When adding GitHub Actions with `pnpm/action-setup@v4`, always provide a pnpm version source (`with.version` in workflow and/or `packageManager` in `package.json`) or CI will fail before dependency install.
- When protecting global keyboard shortcuts from focused interactive controls, do not blanket-disable navigation keys (`j/k`); allow intended global navigation keys while still preserving native activation keys like `Enter`.

## 2026-02-25
- When adding focused-interactive guards for keyboard shortcuts, include all intended global shortcuts (`c` for comments, not just `j/k`) and add an explicit regression test for focused-control behavior.
