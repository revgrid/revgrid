---
title: Cell Painter
---

Cell painters convert resolved view-cell state into canvas drawing operations.

A painter typically reads:

1. Cell value and metadata.
1. Style settings (alignment, colors, fonts, padding).
1. Cell bounds and rendering context.

Painters should be deterministic and side-effect free so the renderer can schedule redraws safely.

Standard implementations are documented in [Standard Cell Painters](../libraries/standard/cell-painters/index.md).
