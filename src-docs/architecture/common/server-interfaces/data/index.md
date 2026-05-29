---
title: Data Server
---

The Data Server contract provides row-based access to values and row mutation notifications.

Responsibilities include:

1. Exposing stable row counts and value lookup semantics.
1. Reporting invalidation and reindex events when data changes.
1. Allowing the client to refresh only impacted ranges for performance.

Implementations include `data-row-array`, `record`, and `sourced-field` server families. Each implementation maps these primitives to its own storage model while preserving the same consumer-facing contract.

## Primary Public Symbols

1. {@link common/server-interfaces/data/data-server!RevDataServer:interface RevDataServer}
1. {@link common/server-interfaces/data/data-server!RevDataServer.NotificationsClient:interface NotificationsClient}
1. {@link common/server-interfaces/data/data-server!RevDataServer.ViewValue:type ViewValue}
1. {@link common/server-interfaces/data/data-server!RevDataServer.EditValue:type EditValue}
1. {@link common/server-interfaces/data/data-server!RevDataServer.ViewRow:type ViewRow}
1. {@link common/server-interfaces/data/data-server!RevDataServer.ObjectViewRow:type ObjectViewRow}
1. {@link common/server-interfaces/data/data-server!RevDataServer.ArrayViewRow:type ArrayViewRow}
1. {@link common/server-interfaces/data/data-server!RevDataServer.Constructor:type Constructor}

The API Reference page for this module documents all method signatures and callback members on these types.
