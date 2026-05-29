---
title: Definition
---

# Grid Definition

The `definition` object wires together structural and behavioral dependencies for a grid instance.

Typical members include:

1. Schema/data/meta server providers.
1. Column and subgrid configuration.
1. Painter/editor resolution hooks.
1. Optional behavior/controller customization points.

Treat this as the primary composition root for per-grid runtime behavior.
