---
title: Mouse
---

# Mouse Component

Defines the {@link client/components/mouse/mouse!RevMouse:class | RevMouse} class, which manages mouse interactions for the grid component. It encapsulates all logic for mouse-based cell interaction, drag operations, and UI feedback within the grid.

## Main responsibilities

* **Hover Tracking**: Tracks which cell the mouse is currently hovering over and updates the cursor and tooltip/title text accordingly.
* **Drag Operations**: Keeps track of the current drag type (e.g., selection extension, column resizing/moving) for mouse-driven grid actions.
* **Event Handling**: Provides event hooks for cell enter/exit and cell render invalidation, allowing integration with other grid behaviors.
* **Cursor and Title Management**: Updates cursor and title text when hovered cell changes., operation, or location context.
* **Integration**: Works closely with the grid's [canvas](../canvas/index.md) and view layout to map mouse positions to grid cells and update UI feedback.

## Location and DragType
{@link client/components/mouse/mouse!RevMouse:class | RevMouse} updates the cursor and title text based on the mouse's location and the current active drag type. These can have the following values:

### {@link client/components/mouse/mouse!RevMouse.DragType | Drag Type}

Specifies the type of drag when dragging is active.

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
