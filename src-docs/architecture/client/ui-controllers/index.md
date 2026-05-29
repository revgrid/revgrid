---
title: UI Controllers
children:
    - ./cell-click/index.md
    - ./clipboard/index.md
    - ./column-moving/index.md
    - ./column-resizing/index.md
    - ./filters/index.md
    - ./focus-scroll/index.md
    - ./hover/index.md
    - ./row-resizing/index.md
    - ./selection/index.md
    - ./touch-scrolling/index.md
---

# UI Controller

UI controllers are input adapters between raw canvas/browser events and grid behavior APIs.

Controller responsibilities:

1. Hit testing and gesture interpretation.
1. Mapping input intent to behavior/component actions.
1. Preserving interaction priority (for example resize vs select vs click).
1. Triggering focused invalidation/repaint updates.

Controllers are composable through the UI-controller manager, allowing applications to replace or extend specific interaction modes without rewriting core grid logic.
