---
title: Meta
---

The Meta Server contract is optional and provides auxiliary information for rows and cells.

Typical metadata includes:

1. Validation flags.
1. Conditional formatting hints.
1. State markers such as recently changed or pinned content.

When supplied, metadata is consumed by behaviors and painters during invalidation and rendering to produce richer UX without coupling data storage to presentation details.

## Primary Public Symbols

1. {@link common/server-interfaces/meta/meta-server!RevMetaServer:interface RevMetaServer}
1. {@link common/server-interfaces/meta/meta-server!RevMetaServer.RowProperties:interface RowProperties}
1. {@link common/server-interfaces/meta/meta-server!RevMetaServer.RowMetadata:type RowMetadata}
1. {@link common/server-interfaces/meta/meta-server!RevMetaServer.CellOwnProperties:type CellOwnProperties}
1. {@link common/server-interfaces/meta/meta-server!RevMetaServer.DefaultRowProperties:class DefaultRowProperties}
1. {@link common/server-interfaces/meta/meta-server!RevMetaServer.DefaultRowProperties.HeightChangedEventer:type HeightChangedEventer}

The API Reference page for this module documents all properties and method signatures for metadata structures.
