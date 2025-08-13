---
title: Canvas
---

# Canvas Component

Defines the {@link client/components/canvas/canvas!RevCanvas:class | RevCanvas} class, which encapsulates a grid's HTML canvas element and manages its rendering and user interaction. It is the central component for rendering and handling all user interactions with the grid's canvas surface.

## Main responsibilities

* **Canvas Management**: Creates, configures, and attaches the canvas element to the DOM, handling sizing, DPI scaling, and resizing logic.
* **Rendering Context**: Wraps the 2D rendering context for efficient drawing operations.
* **Event Handling**: Registers and manages a wide range of event listeners for pointer, mouse, keyboard, touch, clipboard, drag-and-drop, and focus events.
* **Pointer and Drag State**: Tracks pointer and drag states to support complex interactions like dragging and selection.
* **Resizing Logic**: Observes host element size changes and debounces resize events to optimize performance.
* **Utility Methods**: Provides methods for focus management, cursor and title updates, and event dispatching.
* **External Integration**: Allows external code to add or remove event listeners on the canvas element.

## Rendering context

Creates a [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) for the canvas and then wraps it in a {@link common/types-utils/cached-canvas-rendering-context-2d!RevCachedCanvasRenderingContext2D:class | RevCachedCanvasRenderingContext2D} object. The `RevCachedCanvasRenderingContext2D` object caches the context's properties and will not update them unless they are changed. All drawing related operations on the canvas use `RevCachedCanvasRenderingContext2D`. 

## Resizing

Ensures that the canvas element is always resized to match the size of its parent element ({@link client/components/canvas/canvas!RevCanvas#hostElement | hostElement}). Resize related events are debounced to minimise the number of renders when resizing.

## Drag events

Drag events are simulated by:
* listening for `dragstart` events from canvas element
* capturing the mouse
* firing simulated `drag` events when canvas `mousemove` events occur while dragging is active
* firing simulated `dragEnd` events when canvas `mouseup` of `mousecancel` events occur while dragging is active
* releasing the mouse.

## Settings used
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#useHiDPI | useHiDPI}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#resizedEventDebounceExtendedWhenPossible | resizedEventDebounceExtendedWhenPossible}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#resizedEventDebounceInterval | resizedEventDebounceInterval}

