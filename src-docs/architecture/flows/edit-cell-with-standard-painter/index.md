---
title: Edit Cell with Standard Painter Flow
---

This flow describes how standard painters render editable cells before/after edit operations.

1. Renderer resolves the active painter for each visible cell.
1. Painter draws value and visual affordances (focus/selection/read-only cues).
1. After value changes, invalidation triggers repaint.
1. Same painter contract renders updated state without editor-specific coupling.

This separation keeps editing logic and painting logic independently testable.
