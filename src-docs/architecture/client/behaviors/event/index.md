---
title: Event Behavior
---

Event behavior centralizes dispatch and subscription for grid-level events.

It provides a stable place for applications to observe focus, selection, structural, and value-change activity.

## Primary Class

{@link client/behavior/event-behavior!RevEventBehavior:class RevEventBehavior}

## Event Channels

1. UI input channels: keyboard, pointer, wheel, touch, clipboard, context-menu.
1. Structural channels: active/field column list changes and view-width changes.
1. Focus/selection channels: focused cell or row changes, selection changed.
1. Render/lifecycle channels: rendered, resize, scroller actions, data-server row-list changed.

## Key Members

1. processColumnSortEvent(...): Column-sort interaction event bridge.
1. processDataServersRowListChanged(...): Aggregated row-list change notification bridge.
1. destroy(): Stops event forwarding and marks behavior as inactive.

## Integration Pattern

Event behavior wires component eventers in its constructor, then forwards each event through:

1. UI eventer callbacks.
1. Descendant event delegates.
1. Optional DOM custom-event dispatch (when enabled).
