---
title: Features
---

# Features

* **Realtime**\
Revgrid obtains all its data from realtime feeds from in-process servers (components/objects).  It also receives schema changes from in-process servers.  This allows it to immediately respond to fast changing business models.  For example, displaying data from stock market feeds.
* **Speed**\
Its focus is to update data in the grid as fast as possible, supporting fast changing grid displays.  Updates are optimised to reduce unnecessary display renders.
* **Snappy UI**\
The UI is fast and responsive to mouse and keyboard inputs.
* **Virtual (supporting display of very large data sets)**\
The core client grid is fully virtual.  It only stores data it is currently displaying.  This allows grids of effectively unlimited size.
* **Event driven (low CPU usage)**\
The grid is fully event driven.  There is no polling or looping - not even with redrawing.
* **Multiple selections (rectangle, row and column)**\
Various configuration options control which selection types can be made, whether multiple are allowed and key bindings.  Row and column changes will update selections appropriately and sorting will update row selections.
* **Focus**\
A single cell can have `focus`.  Cell edit operations will occur on the cell which has focus.
* **Drawing**\
While cells normally contain text, they can also contain drawn images.
* **Editing**\
Cell values can be edited and the servers updated with the changed values.
* **Smooth horizontal scrolling**\
Horizontal scrolling can be configured to be smooth or jump from column to column.
* **Multiple subgrids (eg. header, main, footer)**\
A grid consists of one or more subgrids with different row data sources but sharing the same columns.
* **Fixed rows and columns**\
A number of columns on the left can be specified as fixed so that they do not scroll and remain visible.  Likewise, a number of rows on the top of the main subgrid can be specified as fixed so that they do not scroll.
* **Sorting and filtering**
Base grid ({@link client/client-grid!RevClientGrid:class RevClientGrid}) has various types of hooks (events, server support) for sorting and filtering.  {@link record/record-grid!RevRecordGrid:class RevRecordGrid} (and its descendants) implements these hooks and support sorting and filtering.
* **Highlight recent changes**
* **Extendable settings**
* **Fields can be of any type**
* **Plug in cell painters**
* **Plug in grid painters**
* **Plug in cell editors**
* **Plug in UI controllers**
* **Comes with several predefined servers:**
  * **Data Row Array**\
  Provides an array of JSON objects where keys are fields and have values. This is a fixed display and does send updates. Allows static grids to be quickly displayed.
  * **Record**\
  A server which automatically maps fields to columns and records to row. This allows servers to ignore movement of columns and rows.
  * **Table**\
  A server based on table definitions which supports 'joining' data sources.
  * **Single Heading**\
  A header with single line headings.
  * **Multiple Heading**
  A header with multi line headings.
* **A JavaScript grid implementation (no generic parameters)**
