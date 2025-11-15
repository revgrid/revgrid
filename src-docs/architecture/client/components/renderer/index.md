---
title: Renderer
children:
    - ./animation/index.md
    - ./grid-painters/index.md
---

# Renderer Component

Defines the {@link client/components/renderer/renderer!RevRenderer:class RevRenderer} class, which manages the visual display and painting of the grid.

 * The renderer works in conjunction with the {@link RevViewLayout} to determine what needs to be painted and where.
 * It uses a {@link RevGridPainter} to perform the actual painting on the {@link RevCanvas}.
 *
 * The renderer also handles animation through the {@link RevAnimator}, allowing for smooth transitions and updates.
 * It processes render actions queued in the {@link RevRenderActionQueue} to efficiently update the display.
 * The renderer listens to changes in the grid settings, view layout, focus, selection, and mouse interactions to determine when to repaint.
 * It provides methods to invalidate specific parts of the view, triggering re-renders as needed.
 * The renderer also tracks server notifications to ensure that the display is up-to-date with the latest data.
 * It exposes an eventer to notify when rendering is complete.
 * The renderer can be started and stopped, allowing for control over the rendering process.
 * It supports multiple grid painters, allowing for different rendering strategies based on the grid's configuration.
 * It ensures that the grid's visual representation is always in sync with its underlying data and state.


## Primary Responsibilities

1. **Render Management**: Orchestrates the rendering pipeline for grid cells, subgrids, and visual elements
2. **Animation Control**: Manages frame-based animations and timing intervals for smooth visual updates
3. **Invalidation System**: Tracks which parts of the grid need to be repainted and queues render actions
4. **Server Notification Tracking**: Synchronizes client-side rendering with server-side data changes

## Key Components

- **Grid Painters**: Uses a repository pattern to manage different painting strategies (default: by-columns-and-rows)
- **Render Action Queue**: Batches rendering operations for efficient processing
- **Animator**: Controls animation timing and frame-based updates
- **Event Coordination**: Integrates with focus, selection, mouse, and layout systems

## Core Features

- **Selective Rendering**: Can invalidate and repaint individual cells, rows, columns, or the entire view
- **Performance Optimization**: Includes background/foreground animation intervals and document visibility handling
- **Server Synchronization**: Provides promises that resolve when server notifications are fully rendered
- **Auto-sizing**: Automatically recalculates column widths during painting when needed

## API Highlights

- `invalidateView()` - Marks entire view for repainting
- `invalidateViewCell()` - Marks specific cell for repainting  
- `waitLastServerNotificationRendered()` - Async coordination with server changes
- `start()/stop()` - Lifecycle management for animation system
- `repaintAll()` - Forces complete grid repaint

This module serves as the central rendering coordinator, ensuring the grid's visual state stays synchronized with data changes while maintaining smooth performance through intelligent invalidation and batched painting operations.
