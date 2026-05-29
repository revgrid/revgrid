---
title: Schema
---

The Schema Server contract defines the column/field model consumed by the grid.

Responsibilities include:

1. Returning the active schema fields and structural metadata.
1. Notifying the client when column structures change.
1. Supporting column identity and lookup for stable rendering and selection.

Schema implementations are typically composed with Data Server implementations so field definitions and values remain aligned.
