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

## Element

The HTML [canvas element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/canvas) on which the grid is drawn is passed in via the constructor and can be accessed by the readonly {@link client/components/canvas/canvas!RevCanvas:class | RevCanvas}.{@link client/components/canvas/canvas!RevCanvas.element | element} field.

### Element required settings

The passed in canvas requires the following properties to be set as per below:

* **[tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex)** greater than zero\
Make sure the canvas is focusable
* **[draggable](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/draggable)** = true\
Allows elements on the grid to be dragged
* **[padding](https://developer.mozilla.org/en-US/docs/Web/CSS/padding)** = 0
* **[border-width](https://developer.mozilla.org/en-US/docs/Web/CSS/border-width)** = 0\
Both padding and border width need to be set to zero so that the client area of the canvas can be calculated with [getBoundingClientRect()](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).

### Element recommended settings

Below are the recommended settings for an element:

* **[id](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/id)** = &lt;unique value&gt;\
Assist with debugging
* **[display](https://developer.mozilla.org/en-US/docs/Web/CSS/display)** = block\
Should be sufficient for most arrangements
* **[height](https://developer.mozilla.org/en-US/docs/Web/CSS/height)** = '100%'\
Take up all space in parent element to make adding overlay element easy (see overlay element below)
* **[width](https://developer.mozilla.org/en-US/docs/Web/CSS/width)** = '100%'\
Take up all space in parent element to make adding overlay element easy (see overlay element below)
* **[margin](https://developer.mozilla.org/en-US/docs/Web/CSS/margin)** = '0'\
Make it easy to align canvas client area with overlay element client area (see overlay element below)
* **[outline](https://developer.mozilla.org/en-US/docs/Web/CSS/outline)** = 'none'\
Prevent outline when canvas is focused

## Overlay Element

Some operations require that other HTML elements be overlayed over the canvas element.  This includes operations such as cell editing (which may involve overlaying an &lt;input&gt; element) or dragging columns (which uses an overlayed &gt;canvas&lt; element to show where the column will be dropped). In order to position these elements in the correct place, an `overlay` element must exist over the `canvas` element.  The overlay element can almost any type of HTML element however, its client area must be the same size as the `canvas` client area and the overlay element must be positioned (ie not have [`static`](https://developer.mozilla.org/en-US/docs/Web/CSS/position#static) [position](https://developer.mozilla.org/en-US/docs/Web/CSS/position)).

The overlay element can optionally be passed in as a parameter in the constructor via [Revgrid options](../../grid/options/index.md). If this is not provided, then the `canvas` element's parent element will be used as the overlay element.

If the `canvas` uses the recommended properties, then the parent element can easily be used. It only requires [`position`](https://developer.mozilla.org/en-US/docs/Web/CSS/position) to not be [`static`](https://developer.mozilla.org/en-US/docs/Web/CSS/position#static) and `padding` to be 0. If you do want some non zero padding, then this can be set provided that the `canvas` element's margin properties are set to the same value(s).

## Rendering context

Creates a [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) for the canvas and then wraps it in a {@link common/types-utils/cached-canvas-rendering-context-2d!RevCachedCanvasRenderingContext2D:class | RevCachedCanvasRenderingContext2D} object. The `RevCachedCanvasRenderingContext2D` object caches the context's properties and will not update them unless they are changed. All drawing related operations on the canvas use `RevCachedCanvasRenderingContext2D`. 

## Resizing

Ensures that the canvas element is always resized to match the size of its parent element. Resize related events are debounced to minimise the number of renders when resizing.

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

