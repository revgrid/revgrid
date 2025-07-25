---
title: Data Row Array Test
children:
    - ./app/index.md
---

# Data Row Array Test App

The [Data Row Array Test app](./app/index.md) is used to test the {@link data-row-array/server/data-row-array-data-server!RevDataRowArrayDataServer:class RevDataRowArrayDataServer} and its associated {@link data-row-array/data-row-array-grid!RevDataRowArrayGrid:class grid}.  Descendants of DataRowArray grid typically have a `setData(data)` method which updates all the rows and cells in the grid at once.  Individual rows or cells cannot be updated.  The data is passed as an array of JSON objects of type {@link common/server-interfaces/data/data-server!RevDataServer.ObjectViewRow `ObjectViewRow`}.

This app uses {@link sourced-field/data-row-array/multi-heading/multi-heading-data-row-array-sourced-field-grid!RevMultiHeadingDataRowArraySourcedFieldGrid:class RevMultiHeadingDataRowArraySourcedFieldGrid} which supports multi line headings.  If you only require one heading line, you can use {@link sourced-field/data-row-array/single-heading/single-heading-data-row-array-sourced-field-grid!RevSingleHeadingDataRowArraySourcedFieldGrid:class RevSingleHeadingDataRowArraySourcedFieldGrid}.

DataRowArray grids allow you to easily display static data in a grid.

## Code

### DataRowArrayGrid

The grid itself extends from {@link sourced-field/data-row-array/multi-heading/multi-heading-data-row-array-sourced-field-grid!RevMultiHeadingDataRowArraySourcedFieldGrid:class RevMultiHeadingDataRowArraySourcedFieldGrid}. This sub-class:
* creates the grid fields,
* creates the header cell painter,
* creates the main cell painter,
* processes various events from the base class by overriding various functions.

{@includeCode ../../../test-app/data-row-array/data-row-array-grid.ts}

### main

The main class which ties everything together:

{@includeCode ../../../test-app/data-row-array/main.ts}
