---
title: Client Setting Interfaces
---

Client setting interfaces define the configurable surface for grid behavior and appearance.

Key interface families include:

1. Grid-level settings (`grid-settings`, `only-grid-settings`, `behaviored-grid-settings`).
1. Column-level settings (`column-settings`, `only-column-settings`, `behaviored-column-settings`).
1. Composite settings (`behaviored-settings`) and invalidation enums used for efficient re-render decisions.

These interfaces are consumed by grid construction and runtime behavior modules, and are implemented by classes in `settings-implementations`.
