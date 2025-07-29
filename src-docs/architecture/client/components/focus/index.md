---
title: Focus
---

# Focus Component

The {@link client/components/focus/focus!RevFocus:class RevFocus} class, which manages cell focus and cell editing within a grid component. It holds the central logic for managing which cell is focused and how cell editing is triggered and maintained in the grid UI.

## Main responsibilities

* **Tracking Focus**: Maintains the currently focused cell, previous focus, and their positions within the grid and canvas.
* **Focus Operations**: Provides methods to set, clear, and update focus by column, row, or cell, including logic to determine if a cell is focusable.
* **Editor Management**: Handles opening, closing, and updating cell editors when a cell is focused, including keyboard and mouse event processing for editing.
* **Grid Changes**: Adjusts focus and editor state in response to grid structure changes (rows/columns inserted, deleted, or moved).
* **Invalidation**: Invalidates editor values when relevant grid cells or rows change.
* **Stashing/Restoring**: Supports stashing and restoring focus state for scenarios like sorting and filtering.
* **Event Hooks**: Exposes event handlers for focus and editor changes, allowing integration with selection and behavior logic.

## Setting focus

It is recommended to set focus with methods in {@link client/behavior/focus-select-behavior!RevFocusSelectBehavior:class RevFocusSelectBehavior} instead of using the methods in {@link client/components/focus/focus!RevFocus:class RevFocus}.  The {@link client/behavior/focus-select-behavior!RevFocusSelectBehavior:class RevFocusSelectBehavior} methods will ensure that `focus` and `selection` remain suitably co-ordinated.

## Stash and restore

When sorting or filtering a grid, the location of focus in the grid may change. To ensure that the same cell remains focused after the sort or filter operation, a 'stash' of the focus location is created prior to the operation and then the focus is restored using the 'stash' after the operation. In order to generate the stash, it is necessary to implement the {@link common/server-interfaces/data/data-server!RevDataServer | RevDataServer} {@link common/server-interfaces/data/data-server!RevDataServer#getRowIndexFromId | getRowIndexFromId()} function. If this is not implemented, focus will be lost after sort or filter operations. When restoring focus from a 'stash', the {@link common/server-interfaces/data/data-server!RevDataServer#getRowIndexFromId | getRowIndexFromId()} function will be used if it is implemented. Otherwise, the {@link common/server-interfaces/data/data-server!RevDataServer#getRowIdFromIndex | getRowIdFromIndex()} will be used.

## Settings used
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#editOnFocusCell | editOnFocusCell}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#editKey | editKey}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#editOnKeyDown | editOnKeyDown}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#editOnClick | editOnClick}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#fixedRowCount | fixedRowCount}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#fixedColumnCount | fixedColumnCount}
