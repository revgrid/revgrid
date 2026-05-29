---
title: Record Server
---

Record servers represent rows as strongly typed records and field descriptors.

They support:

1. Record definitions and field-level extraction.
1. Row index maps and row-order definitions.
1. Incremental updates and recent-change tracking.

This model is useful when data has rich record identity semantics or requires controlled transformation before rendering.

## Primary Public Symbols

1. {@link record/server/record-data-server!RevRecordDataServer:class RevRecordDataServer}
1. {@link record/server/record-schema-server!RevRecordSchemaServer:class RevRecordSchemaServer}
1. {@link record/server/record-store!RevRecordStore:interface RevRecordStore}
1. {@link record/server/record!RevRecord:type RevRecord}
1. {@link record/server/record-field!RevRecordField:interface RevRecordField}
1. {@link record/server/record-definition!RevRecordDefinition:interface RevRecordDefinition}
1. {@link record/server/record-sort-definition!RevRecordSortDefinition:namespace RevRecordSortDefinition}
1. {@link record/server/record-row-order-definition!RevRecordRowOrderDefinition:class RevRecordRowOrderDefinition}
1. {@link record/server/record-recent-change!RevRecordRecentChange:type RevRecordRecentChange}
1. {@link record/server/record-recent-changes!RevRecordRecentChanges:class RevRecordRecentChanges}

## Additional Record Utilities

Record server modules also export row/index map helpers, array utilities, type utilities, and error types; see API Reference for complete symbol/member coverage.
