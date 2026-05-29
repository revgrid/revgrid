---
title: Servers
children:
    - ./headings/index.md
    - ./data-row-array/index.md
    - ./column-layout/index.md
    - ./sourced-field/index.md
    - ./record/index.md
    - ./table/index.md
    - ./meta/index.md
---

Servers provide schema, data, and optional metadata to the client grid.

Each server family targets a different data model:

1. [Headings](./headings/index.md): heading-specific schema/data support.
1. [Data Row Array](./data-row-array/index.md): array-backed data providers.
1. [Column Layout](./column-layout/index.md): column layout definitions and references.
1. [Sourced Field](./sourced-field/index.md): composed fields from one or more sources.
1. [Record](./record/index.md): record-oriented schema/data model.
1. [Table](./table/index.md): table abstractions for sourced-field record flows.
1. [Meta](./meta/index.md): optional metadata providers.

All server implementations align with `common/server-interfaces/*` contracts so the client can remain implementation-agnostic.
