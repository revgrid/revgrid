---
title: Focus Scroll Behavior
---

Focus-scroll behavior ensures focused cells remain visible.

When focus moves outside the viewport, it calculates required scroll adjustments and coordinates with scroller and view-layout components.

## Primary Class

{@link client/behavior/focus-scroll-behavior!RevFocusScrollBehavior:class RevFocusScrollBehavior}

## Key Members

1. tryFocusColumnRowAndEnsureInView(...): Combined focus + ensure-visible for a cell coordinate.
1. tryFocusColumnAndEnsureInView(...), tryFocusRowAndEnsureInView(...): Axis-specific variants.
1. tryMoveFocusLeft/Right/Up/Down(): Single-step navigation.
1. tryFocusFirstColumn(), tryFocusLastColumn(), tryFocusTop(), tryFocusBottom(): Boundary navigation.
1. tryPageFocusLeft/Right/Up/Down(): Page-wise movement with explicit scroll anchors.
1. tryScrollLeft/Right/Up/Down(): Scroll movement without changing focus ownership.

## Notes

These APIs rely on focusability and scrollability checks before mutating state, ensuring fixed rows/columns and role-specific subgrids behave consistently.
