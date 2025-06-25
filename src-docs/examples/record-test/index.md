---
title: Record Test
children:
    - ./app/index.md
---

# Record Test App

The [Record Test app](./app/index.md) is used to test aspects of the [record](/revgrid/record/) module.  It also includes some performance testing. (It may be easier to open this link in another tab or window)

## Code

### Record

The record data type is declared in the following namespace:

{@includeCode ../../../test-app/record/record-store.ts#record}

Records will be passed to client (as [DataRows](/revgrid/common/RevDataServer/ViewRow/)) where each is an array with 5 elements (fields).

### Grid Field

The `GridField` classes implement [`RevRecordField`](/revgrid/record/RevRecordField-1/) and provide access to the values in the fields for each record/row.

{@includeCode ../../../test-app/record/grid-field.ts#gridField,intValGridField}

### RecordStore

RecordStore implements [`RevRecordStore`](/revgrid/record/RevRecordStore-1/). It provides the client with access to records (rows) and also allows records to be added and deleted by the user interface.  Whenever records are added or deleted, RecordStore will send a notification to the client.  It will also send an `invalidate` notification to the client if the grid, a record, or any values in a record are changed.

{@includeCode ../../../test-app/record/record-store.ts#recordStore}

### Cell Painter

The [cell painter](../../architecture/cell-painter/index.md) will paint a cell whenever it is invalidated.  Note that this class will use JavaScript default `toString()` to convert field values to a string.

{@includeCode ../../../test-app/record/main-cell-painter.ts}

### RecordGrid

The grid itself extends from [`RevRecordGrid`](/revgrid/record/RevRecordGrid-1/). This sub-class processes various events from the base class by overriding various functions:

{@includeCode ../../../test-app/record/record-grid.ts}

### main

Finally, we have the main class which ties everything together:

{@includeCode ../../../test-app/record/main.ts}
