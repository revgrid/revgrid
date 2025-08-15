---
title: Columns Manager
---

# Columns Manager Component

Defines the {@link client/components/column/columns-manager!RevColumnsManager:class | RevColumnsManager} class, which manages all aspects of grid columns in the revgrid component. It is the central class for managing the structure, visibility, sizing, and settings of columns in the grid, ensuring that the grid view and data schema remain synchronized.

## Main Responsibilities

* **Column Lists**: Maintains two main lists: all columns defined by the schema ({@link client/components/column/columns-manager!RevColumnsManager#fieldColumns | fieldColumns}) and the currently visible/active columns ({@link client/components/column/columns-manager!RevColumnsManager#activeColumns | activeColumns}).
* **Schema Integration**: Responds to schema changes (insertions, deletions, updates) and recreates columns as needed.
* **Column Visibility**: Supports showing, hiding, and reordering columns, including batch operations and duplicate handling.
* **Column Widths**: Manages column widths, including setting, auto-sizing, and notifying listeners of width changes.
* **Fixed Columns**: Calculates and manages fixed columns (columns that do not scroll horizontally).
* **Settings Management**: Loads and merges settings for columns, supporting both bulk and individual updates.
* **Event Notification**: Notifies listeners about changes to columns, such as list changes and width changes, to keep the grid layout in sync.
* **Column Operations**: Provides utility methods for swapping, moving, and auto-sizing columns, as well as retrieving hidden columns.

## Field Columns

There is one Field {@link client/interfaces/column!RevColumn | Column} for each {@link common/server-interfaces/schema/schema-field!RevSchemaField | field} in the {@link common/server-interfaces/schema/schema-server!RevSchemaServer | schema server}. These are listed in {@link client/components/column/columns-manager!RevColumnsManager:class | RevColumnsManager}.{@link client/components/column/columns-manager!RevColumnsManager#fieldColumns | fieldColumns} with the same order as the respective {@link common/server-interfaces/schema/schema-field!RevSchemaField | fields} in the {@link common/server-interfaces/schema/schema-server!RevSchemaServer | schema server}.

Currently, the field columns are regenerated after any change to the list of fields in the schema server. These changes are not broadcast to other components in the grid; so currently, it is not recommended to change the schema after a grid has been {@link client/client-grid!RevClientGrid#activate | activated}. In the future, {@link client/components/column/columns-manager!RevColumnsManager:class | RevColumnsManager} needs to better support {@link common/server-interfaces/schema/schema-server!RevSchemaServer | RevSchemaServer}.{@link common/server-interfaces/schema/schema-server!RevSchemaServer.NotificationsClient | NotificationsClient} to allow lists of fields in schemas to be changed after a grid has been activated.

## Active Columns

Active {@link client/interfaces/column!RevColumn | columns} are columns that can be viewed in the grid.  They are always a subset of Field {@link client/interfaces/column!RevColumn | columns}. Their order in {@link client/components/column/columns-manager!RevColumnsManager:class | RevColumnsManager}.{@link client/components/column/columns-manager!RevColumnsManager#activeColumns | activeColumns} corresponds to the order in which they are displayed in the grid.

Do not change the contents of the {@link client/components/column/columns-manager!RevColumnsManager:class | RevColumnsManager}.{@link client/components/column/columns-manager!RevColumnsManager#activeColumns | activeColumns} list directly. Instead use {@link client/components/column/columns-manager!RevColumnsManager:class | RevColumnsManager} functions such as:
* {@link client/components/column/columns-manager!RevColumnsManager#showHideColumns | showHideColumns()}
* {@link client/components/column/columns-manager!RevColumnsManager#hideColumns | hideColumns()}
* {@link client/components/column/columns-manager!RevColumnsManager#setActiveColumnsAndWidthsByFieldName | setActiveColumnsAndWidthsByFieldName()}
* {@link client/components/column/columns-manager!RevColumnsManager#hideActiveColumn | hideActiveColumn()}
* {@link client/components/column/columns-manager!RevColumnsManager#setActiveColumns | setActiveColumns()}
* {@link client/components/column/columns-manager!RevColumnsManager#swapActiveColumns | swapActiveColumns()}
* {@link client/components/column/columns-manager!RevColumnsManager#moveActiveColumn | moveActiveColumn()}

Note that currently, focus and selection is not updated to reflect changes to active columns.

## Column Widths
A column width can either be fixed or auto sizing.  If it is auto sizing, then the width of the column will be automatically widened so that content of all visible cells in that column is fully displayed (up to the maximum size specified by the {@link client/settings/only-grid-settings!RevOnlyGridSettings#columnAutoSizingMax | columnAutoSizingMax} setting).

This automatic widening is done as part of rendering the cells. Whenever the grid is rendered, it calculates maximum size of the content of each cell rendered. From this it works out the minimum column size needed to fully display all its visible cells.  If the column width is less than this minimum width and the column width is auto sizing, then the column's width is increased to this calculated minimum, and the grid is re-rendered.

## Settings used
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#defaultColumnWidth | defaultColumnWidth}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#minimumColumnWidth | minimumColumnWidth}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#maximumColumnWidth | maximumColumnWidth}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#defaultColumnAutoSizing | defaultColumnAutoSizing}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#columnAutoSizingMax | columnAutoSizingMax}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#verticalGridLinesWidth | verticalGridLinesWidth}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#fixedColumnCount | fixedColumnCount}
