---
title: Selection
---

# Selection Component

The {@link client/components/selection/selection!RevSelection:class RevSelection} class, which manages selection logic for a grid component.

## Main responsibilities

* **Selection Representation**: Selections are stored as rectangles, rows, and columns for efficient memory usage and quick checks.
* **Selection Operations**: Provides methods to select, deselect, and toggle selection for cells, rows, columns, and rectangular areas. Supports single and multiple selection areas.
* **Area Types**: Handles different selection area types (all, rectangle, row, column) and tracks the last selected area.
* **Focus Linking**: Integrates with the grid's focus system to clear selection when focus changes, if linked.
* **Change Management**: Batches selection changes to minimize event firing and supports silent changes.
* **Stashing/Restoring**: Can stash and restore selection state, including selected rows and columns, for filtering and sorting scenarios.
* **Selection Queries**: Provides methods to check if a cell, row, or column is selected, and to get the type of selection covering a cell.
* **Grid Changes**: Adjusts selection state when rows or columns are inserted, deleted, or moved.
* **Events**: Exposes event hooks for notifying when selection changes.

## Selection areas

A selection consists of one or more selection areas. There are 4 types of selection areas enumerated by {@link common/types-utils/selection-area-type!RevSelectionAreaTypeId | RevSelectionAreaTypeId}.

* **dynamicAll**: All the cells within a selection's subgrid. The size of this area will dynamically adjust if rows or columns are added or deleted.
* **rectangle**: A rectangle of cells within the selection's subgrid.
* **row**: One or more contiguous rows within the selection's subgrid.
* **column**: One or more contiguous columns. This is independent of the selection's subgrid.

Selection areas can be in different subgrids however individual areas of type `dynamicAll`, `rectangle`, `row` are fully contained within one subgrid.

## Updating selection

It is recommended to, where possible, set or update a selection with methods in {@link client/behavior/focus-select-behavior!RevFocusSelectBehavior:class RevFocusSelectBehavior} instead of using the methods in {@link client/components/selection/selection!RevSelection:class | RevSelection}. The {@link client/behavior/focus-select-behavior!RevFocusSelectBehavior:class RevFocusSelectBehavior} methods will co-ordinate focus and selection.

If multiple changes are made to a selection, it is recommended to wrap these with calls to {@link client/components/selection/selection!RevSelection#beginChange | beginChange()} and {@link client/components/selection/selection!RevSelection#endChange | endChange()}.  This will reduce the number of times the grid needs to be rendered.

## Stash and restore

When sorting or filtering a grid, the location of cells within selection areas may change. To ensure that the same cells remain selected after the sort or filter operation, a {@link client/components/selection/selection!RevSelection.Stash | stash} of the selection is created prior to the operation and then the selection from the {@link client/components/selection/selection!RevSelection.Stash | stash} is restored after the operation.

The {@link client/components/selection/selection!RevSelection.Stash | stash} contains a representation of the selection areas which is not affected by the sort or filter operation.
* For column areas, the column field names are used.
* For rows, if the {@link common/server-interfaces/data/data-server!RevDataServer:interface | RevDataServer} {@link common/server-interfaces/data/data-server!RevDataServer#getRowIdFromIndex | getRowIdFromIndex()} function exists, it is used to get an `Id` for a row which is not affected by filtering or sorting. If {@link common/server-interfaces/data/data-server!RevDataServer#getRowIdFromIndex | getRowIdFromIndex()} is not implemented, row selection areas will not be included in the {@link client/components/selection/selection!RevSelection.Stash | stash} and be discarded. When restoring rows from a {@link client/components/selection/selection!RevSelection.Stash | stash}, the {@link common/server-interfaces/data/data-server!RevDataServer#getRowIndexFromId | getRowIndexFromId()} function will be used if it is implemented. Otherwise, the {@link common/server-interfaces/data/data-server!RevDataServer#getRowIdFromIndex | getRowIdFromIndex()} will be used however this is not as efficient.
* Only the cell at the first point of the last Rectangle added to a selection will be included in the {@link client/components/selection/selection!RevSelection.Stash | stash}.

## Settings used

* {@link client/settings/only-grid-settings!RevOnlyGridSettings#switchNewRectangleSelectionToRowOrColumn | switchNewRectangleSelectionToRowOrColumn}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#multipleSelectionAreas | multipleSelectionAreas}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#primarySelectionAreaType | primarySelectionAreaType}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#secondarySelectionAreaType | secondarySelectionAreaType}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#mouseRowSelectionEnabled | mouseRowSelectionEnabled}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#mouseColumnSelectionEnabled | mouseColumnSelectionEnabled}
