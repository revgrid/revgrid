---
title: Data Row Array Test
children:
    - ./app/index.md
---

# Data Row Array Test App

The [Data Row Array Test app](./app/index.md) is used to test aspects of the [data-row-array](/revgrid/data-row-array/) module.  DataRowArray grids have a [setData(data)](/revgrid/sourced-field/RevMultiHeadingDataRowArraySourcedFieldGrid-1/#setdata) method which updates all the rows and cells in the grid at once.  Individual rows or cells cannot be updated.  The data is passed as an array of JSON objects of type ([DataRow](/revgrid/data-row-array/RevDataRowArrayGrid/DataRow/)s).

This app uses [`RevMultiHeadingDataRowArraySourcedFieldGrid`](/revgrid/sourced-field/RevMultiHeadingDataRowArraySourcedFieldGrid-1/) which supports multi line headings.  If you only require one heading line, you can use [`RevSingleHeadingDataRowArraySourcedFieldGrid`](/revgrid/sourced-field/RevSingleHeadingDataRowArraySourcedFieldGrid-1/).

DataRowArray grids allow you to easily display static data in a grid.

## Code

### DataRowArrayGrid

The grid itself extends from [`RevMultiHeadingDataRowArraySourcedFieldGrid`](/revgrid/sourced-field/RevMultiHeadingDataRowArraySourcedFieldGrid-1/). This sub-class:
* creates the grid fields,
* creates the header cell painter,
* creates the main cell painter,
* processes various events from the base class by overriding various functions.

{@includeCode ../../../test-app/data-row-array/data-row-array-grid.ts}

### main

The main class which ties everything together:

{@includeCode ../../../test-app/data-row-array/main.ts}
