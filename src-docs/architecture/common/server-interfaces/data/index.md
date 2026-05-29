---
title: Data Server
---

The Data Server contract provides row-based access to values and row mutation notifications.

Responsibilities include:

1. Exposing stable row counts and value lookup semantics.
1. Reporting invalidation and reindex events when data changes.
1. Allowing the client to refresh only impacted ranges for performance.

Implementations include `data-row-array`, `record`, and `sourced-field` server families. Each implementation maps these primitives to its own storage model while preserving the same consumer-facing contract.
