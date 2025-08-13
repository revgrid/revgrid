---
title: Mouse
---

# Mouse Component

Defines the {@link client/components/mouse/mouse!RevMouse:class | RevMouse} class, which manages mouse interactions for the grid component. It encapsulates all logic for mouse-based cell interaction, drag operations, and UI feedback within the grid.

## Main responsibilities

* **Hover Tracking**: Tracks which cell the mouse is currently hovering over and updates the cursor and tooltip/title text accordingly.
* **Drag Operations**: Keeps track of the current drag type (e.g., selection extension, column resizing/moving) for mouse-driven grid actions.
* **Event Handling**: Provides event hooks for cell enter/exit and cell render invalidation, allowing integration with other grid behaviors.
* **Cursor and Title Management**: Updates cursor and title text when hovered cell changes, mouse actions become possible or dragging commences.
* **Integration**: Works closely with the grid's [canvas](../canvas/index.md) and view layout to map mouse positions to grid cells and update UI feedback.

## {@link client/components/mouse/mouse!RevMouse.ActionPossible | Actions Possible}

Indicates when mouse actions are possible:

* {@link client/components/mouse/mouse!RevMouse.ActionPossible.linkNavigate | linkNavigate}
* {@link client/components/mouse/mouse!RevMouse.ActionPossible.columnSort | columnSort}
* {@link client/components/mouse/mouse!RevMouse.ActionPossible.columnResizeDrag | columnResizeDrag}
* {@link client/components/mouse/mouse!RevMouse.ActionPossible.columnMoveDrag | columnMoveDrag}
* {@link client/components/mouse/mouse!RevMouse.ActionPossible.cellEdit | cellEdit} - Cursor name and title text are returned
by {@link client/interfaces/cell-editor!RevCellEditor#processGridPointerMoveEvent | RevCellEditor.processGridPointerMoveEvent}

## {@link client/components/mouse/mouse!RevMouse.DragType | Drag Type}

Specifies the type of drag when dragging is active:

* {@link client/components/mouse/mouse!RevMouse.DragType.lastRectangleSelectionAreaExtending | lastRectangleSelectionAreaExtending}
* {@link client/components/mouse/mouse!RevMouse.DragType.lastColumnSelectionAreaExtending | lastColumnSelectionAreaExtending}
* {@link client/components/mouse/mouse!RevMouse.DragType.lastRowSelectionAreaExtending | lastRowSelectionAreaExtending}
* {@link client/components/mouse/mouse!RevMouse.DragType.columnResizing | columnResizing}
* {@link client/components/mouse/mouse!RevMouse.DragType.columnMoving | columnMoving}

## Settings used
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#mouseLastSelectionAreaExtendingDragActiveCursorName | mouseLastSelectionAreaExtendingDragActiveCursorName}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#mouseLastSelectionAreaExtendingDragActiveTitleText | mouseLastSelectionAreaExtendingDragActiveTitleText}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#columnResizeDragActiveCursorName | columnResizeDragActiveCursorName}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#columnResizeDragActiveTitleText | columnResizeDragActiveTitleText}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#columnMoveDragActiveCursorName | columnMoveDragActiveCursorName}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#columnMoveDragActiveTitleText | columnMoveDragActiveTitleText}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#columnSortPossibleCursorName | columnSortPossibleCursorName}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#columnSortPossibleTitleText | columnSortPossibleTitleText}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#columnResizeDragPossibleCursorName | columnResizeDragPossibleCursorName}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#columnResizeDragPossibleTitleText | columnResizeDragPossibleTitleText}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#columnMoveDragPossibleCursorName | columnMoveDragPossibleCursorName}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#columnMoveDragPossibleTitleText | columnMoveDragPossibleTitleText}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#cellEditPossibleCursorName | cellEditPossibleCursorName} - column setting used in
{@link standard/cell-editor/standard-toggle-click-box-cell-editor!RevStandardToggleClickBoxCellEditor | RevStandardToggleClickBoxCellEditor}
