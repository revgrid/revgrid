---
title: Focus
---

# Focus Component

Implements the {@link client/components/focus/focus!RevFocus:class RevFocus} class, which manages cell focus and cell editing within a grid component. It holds the central logic for managing which cell is focused and how cell editing is triggered and maintained in the grid UI. Its main responsibilities include:

* **Tracking Focus**: Maintains the currently focused cell, previous focus, and their positions within the grid and canvas.
* **Focus Operations**: Provides methods to set, clear, and update focus by column, row, or cell, including logic to determine if a cell is focusable.
* **Editor Management**: Handles opening, closing, and updating cell editors when a cell is focused, including keyboard and mouse event processing for editing.
* **Grid Changes**: Adjusts focus and editor state in response to grid structure changes (rows/columns inserted, deleted, or moved).
* **Invalidation**: Invalidates editor values when relevant grid cells or rows change.
* **Stashing/Restoring**: Supports stashing and restoring focus state for scenarios like undo/redo or grid reloads.
* **Event Hooks**: Exposes event handlers for focus and editor changes, allowing integration with selection and behavior logic.

It is recommended to set focus with methods in {@link client/behavior/focus-select-behavior!RevFocusSelectBehavior:class RevFocusSelectBehavior} instead of using the methods in {@link client/components/focus/focus!RevFocus:class RevFocus}.  The {@link client/behavior/focus-select-behavior!RevFocusSelectBehavior:class RevFocusSelectBehavior} methods will ensure that `focus` and `selection` remain suitably co-ordinated.
