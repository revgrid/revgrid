---
title: Click Flow
---

Click flow handles pointer interactions on grid cells and headings.

1. Canvas dispatches pointer event to UI-controller manager.
1. Cell-click (and related) controllers resolve hit targets.
1. Focus/selection behaviors update state.
1. Renderer is invalidated and repaints changed visuals.

Modifier keys and controller priorities determine whether click is interpreted as focus, selection extension, resize, or move initiation.
