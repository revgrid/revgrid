---
title: View Layout
---

# View Layout Component

Defines the {@link client/components/view/view-layout!RevViewLayout:class | RevViewLayout} class, which is responsible for managing the visual layout of the grid, including the arrangement and sizing of rows and columns, scroll positions, and mapping between data and view coordinates. Overall, RevViewLayout is the core class that translates grid data and configuration into a concrete, interactive visual layout, enabling efficient rendering and smooth user interaction within the grid.

## Main Responsibilities

* **Layout Calculation**: Computes which columns and rows are visible based on scroll position, grid size, and fixed/scrollable sections.
* **Scroll Management**: Manages horizontal and vertical scroll anchors, offsets, and ensures specific cells, columns, or rows are visible when needed.
* **Cell Pooling**: Maintains pools of cell objects for efficient rendering and fast access, supporting both row-major and column-major orderings.
* **Event Integration**: Hooks into events from grid settings, canvas, columns manager, and subgrids manager to recalculate layout when the grid changes.
* **Invalidation and Recalculation**: Provides methods to invalidate and recompute layout when columns, rows, or grid dimensions change.
* **Coordinate Mapping**: Maps between canvas pixel positions and grid cells, columns, and rows, supporting hit-testing and UI interactions.
* **Viewport Utilities**: Offers utility methods for determining visible columns/rows, their bounds, and for limiting indices to the current viewport.
* **Page Navigation**: Calculates anchors for page up/down navigation and supports scrolling by rows or columns programmatically.
* **Gap and Overflow Handling**: Handles gaps between fixed and scrollable areas and manages overflow when columns/rows extend beyond the viewport.

## Horizontal/Vertical

The view layout has 2 dimensions: horizontal and vertical.  The calculations for these dimensions of the layout are mostly independent.  The horizontal calculations involve working out which rows are included in the view while the vertical calculations involve working out which columns are included.

Whenever a view layout is calculated, the {@link client/components/view/view-layout!RevViewLayout#columns | columns} array property has a list of {@link client/interfaces/view-layout-column!RevViewLayoutColumn | RevViewLayoutColumn}s which specify which {@link client/components/column/columns-manager!RevColumnsManager#activeColumns | active columns} are included in the view and their order, position and width.  Likewise, the {@link client/components/view/view-layout!RevViewLayout#rows | rows} array property has a list of {@link client/interfaces/view-layout-row!RevViewLayoutRow | RevViewLayoutRows} which specify which rows are included in the view and their {@link client/interfaces/subgrid!RevSubgrid:interface | subgrid}, order, position and height.

## Cell Pool

After horizontal and vertical calculations have been completed, it is possible to get a cell pool.  This is an array of {@link client/interfaces/view-cell!RevViewCell:interface RevViewCells} where there is one element for each cell in the view.  The pool can be retrieved either with the elements in 'row then column' or 'column then row' order.  The cell pools are used internally for finding cells and painting them.

These pools are cached by {@link client/components/view/view-layout!RevViewLayout:class | RevViewLayout} and should not be cached elsewhere. They will be invalidated whenever the horizontal or vertical calculations are carried out.

Each {@link client/interfaces/view-cell!RevViewCell:interface cell} in the pool contains a {@link client/interfaces/view-cell!RevViewCell#paintFingerprint paintFingerprint} object which a {@link client/interfaces/cell-painter!RevCellPainter:interface | cell painter} can use to store the parameter values that were used when the cell was last rendered. If these parameter values have not changed, then the cell painter does not need to render the cell again. All paintFingerprints will be undefined when a pool is regenerated after horizontal or vertical calculations.

## Scroll Dimension

## Invalidation

## Anchor

## Scroll

In order to best maintain co-ordination with focus when scrolling, functions in {@link client/behavior/focus-scroll-behavior!RevFocusScrollBehavior:class RevFocusScrollBehavior} should be used instead of corresponding functions in the {@link client/components/view/view-layout!RevViewLayout:class | RevViewLayout} class.

## Settings
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#fixedColumnCount | fixedColumnCount}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#fixedRowCount | fixedRowCount}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#gridRightAligned | gridRightAligned}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#viewColumnWidthAdjust | viewColumnWidthAdjust}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#verticalGridLinesWidth | verticalGridLinesWidth}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#verticalFixedLineWidth | verticalFixedLineWidth}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#horizontalGridLinesWidth | horizontalGridLinesWidth}
* {@link client/settings/only-grid-settings!RevOnlyGridSettings#horizontalFixedLineWidth | horizontalFixedLineWidth}
