---
title: Meta
---

The Meta Server contract is optional and provides auxiliary information for rows and cells.

Typical metadata includes:

1. Validation flags.
1. Conditional formatting hints.
1. State markers such as recently changed or pinned content.

When supplied, metadata is consumed by behaviors and painters during invalidation and rendering to produce richer UX without coupling data storage to presentation details.
