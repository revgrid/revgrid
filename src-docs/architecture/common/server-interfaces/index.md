---
title: Server Interfaces
children:
    - ./schema/index.md
    - ./data/index.md
    - ./meta/index.md
---

Server interfaces define the contract between a grid client and the backing providers that supply schema, data and metadata.

Revgrid separates concerns into three interfaces:

1. [Schema](./schema/index.md): column and field structure.
1. [Data](./data/index.md): row count, value access, and change notifications.
1. [Meta](./meta/index.md): optional per-row/per-cell metadata used for styling and UX affordances.

All built-in server implementations in `src/code/*/server` implement these contracts directly or via composition.
