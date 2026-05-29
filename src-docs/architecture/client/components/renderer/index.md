---
title: Renderer
children:
    - ./animation/index.md
    - ./grid-painters/index.md
---

# Renderer Component

The renderer is responsible for converting current grid state into canvas output.

Core responsibilities:

1. Pull visible cells from view layout.
1. Resolve painters and paint order.
1. Apply incremental repaint strategy after invalidation.
1. Coordinate optional animation scheduling.

Renderer logic is intentionally decoupled from data-source concerns.
