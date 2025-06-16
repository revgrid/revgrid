---
title: Features
---

# Features

* Realtime\
Revgrid obtains all its data from realtime feeds from in-process servers (components/objects).  It also receives schema changes from in-process servers.  This allows it to immediately respond to fast changing business models.  For example, displaying data from stock market feeds.
* Speed\
Its focus is to update data in the grid as fast as possible, supporting fast changing grid displays.  Updates are optimised to reduce unnecessary display renders.
* Virtual (supporting display of very large data sets)\
The core client grid is fully virtual.  It only stores data it is currently displaying.  This allows grids of effectively unlimited size.
* Event driven (low CPU usage)\
The grid is fully event driven.  There is no polling or looping - not even with redrawing.
* Multiple selections (rectangle, row and column)\
Various configuration options control which selection types can be made, whether multiple are allowed and key bindings.  Row and column changes will update selections appropriately and sorting will update row selections.
* Focus
* Drawing
* Editing
* Smooth horizontal scrolling
* Multiple subgrids (eg. header, main, footer)
* Fixed rows and columns
* Serialisation of grid configuration
* Extendable settings
* Fields can be of any type
* Plug in cell painters
* Plug in grid painters
* Plug in cell editors
* Plug in UI controllers
* Comes with several predefined servers:
    * Data Row Array\
    Provides an array of JSON objects where keys are fields and have values. This is a fixed display and does send updates. Allows static grids to be quickly displayed.
    * Record\
    A server which automatically maps fields to columns and records to row. This allows servers to ignore movement of columns and rows.
    * Table\
    A server based on table definitions which supports 'joining' data sources.
    * Single Heading
    * Multiple Heading
* A JavaScript grid implementation (no generic variables)
