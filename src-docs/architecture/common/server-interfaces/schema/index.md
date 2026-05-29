---
title: Schema
---

The Schema Server contract defines the column/field model consumed by the grid.

Responsibilities include:

1. Returning the active schema fields and structural metadata.
1. Notifying the client when column structures change.
1. Supporting column identity and lookup for stable rendering and selection.

Schema implementations are typically composed with Data Server implementations so field definitions and values remain aligned.

## Primary Public Symbols

1. {@link common/server-interfaces/schema/schema-server!RevSchemaServer:interface RevSchemaServer}
1. {@link common/server-interfaces/schema/schema-server!RevSchemaServer.NotificationsClient:interface NotificationsClient}
1. {@link common/server-interfaces/schema/schema-server!RevSchemaServer.Constructor:type Constructor}
1. {@link common/server-interfaces/schema/schema-field!RevSchemaField:interface RevSchemaField}
1. {@link common/server-interfaces/schema/schema-server!RevServerNotificationId:type RevServerNotificationId}
1. {@link common/server-interfaces/schema/schema-server!revLowestValidServerNotificationId:var revLowestValidServerNotificationId}
1. {@link common/server-interfaces/schema/schema-server!revInvalidServerNotificationId:var revInvalidServerNotificationId}

The API Reference page for this module documents all method and callback members on these symbols.
