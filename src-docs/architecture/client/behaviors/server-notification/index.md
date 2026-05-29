---
title: Server Notification Behavior
---

Server-notification behavior adapts data/schema/meta server callbacks to client state transitions.

It translates notifications into reindex, invalidation, and structural refresh operations while preserving render performance.

## Primary Class

{@link client/behavior/server-notification-behavior!RevServerNotificationBehavior:class RevServerNotificationBehavior}

## Subscription Lifecycle

1. enableNotifications(): Subscribes schema and data notification clients.
1. disableNotifications(): Unsubscribes notifications safely.
1. reset(), destroy(): Lifecycle cleanup helpers.

## Handler Groups

1. Schema handlers: fieldsInserted, fieldsDeleted, allFieldsDeleted, schemaChanged.
1. Data invalidation handlers: invalidateAll, invalidateRows, invalidateRow, invalidateRowColumns, invalidateRowCells, invalidateCell.
1. Row-list handlers: rowsInserted, rowsDeleted, rowsMoved, rowsLoaded, allRowsDeleted.
1. Reindex handlers: preReindex, postReindex (delegating stash/unstash to reindex behavior).

## Batching

Schema and data change operations are wrapped in begin/end methods so renderer and selection updates are coalesced; row-list-changed notifications are aggregated before being emitted.
