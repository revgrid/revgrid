---
title: Interfaces
---

# Client Interfaces

This section summarizes core client-facing interfaces used by grid, renderer, behaviors, and UI controllers.

## Editing and Painting

1. `RevCellEditor<BCS, SF>`
Key members:
`readonly`, `tryOpenCell(...)`, `closeCell(...)`, `processGridKeyDownEvent(...)`, optional `invalidateValue()`, optional HTML-element lifecycle methods (`setBounds`, `focus`) and eventers (`pullCellValueEventer`, `pushCellValueEventer`, `cellClosedEventer`, `keyDownEventer`).

1. `RevCellPainter<BCS, SF>`
Key member:
`paint(cell, prefillColor)`.
Also includes helper namespace functions such as `roundRect(...)`.

1. `RevCellPossiblyPaintable<BCS, SF>`
Key member:
optional `paint(cell, prefillColor)`.

1. `RevClickBoxCellPainter<BCS, SF>`
Extends `RevCellPainter` and adds `calculateClickBox(cell)`.

## Layout and Data View

1. `RevViewCell<BCS, SF>`
Key members:
`viewValue`, `viewLayoutColumn`, `subgrid`, `viewLayoutRow`, `bounds`, visibility/fixed-role flags, `paintFingerprint`, `clearCellOwnProperties()`.

1. `RevViewLayoutColumn<BCS, SF>`
Key members:
`index`, `activeColumnIndex`, `column`, `left`, `rightPlus1`, `width`.

1. `RevViewLayoutRow<BCS, SF>`
Key members:
`index`, `subgridRowIndex`, `subgrid`, `top`, `bottomPlus1`, `height`.

## Subgrid and Column Model

1. `RevSubgrid<BCS, SF>`
Key members include server references (`schemaServer`, `dataServer`, `metaServer`), role/flags (`role`, `isMain`, `isHeader`, etc.), row-access operations (`getRowCount()`, `getRowHeight(...)`, row metadata/property getters/setters), value resolution (`getViewValue(...)`), and `generateAllRowIndicesArray()`.

1. `RevMainSubgrid<BCS, SF>`
Specialized subgrid interface with `role = main` and `isMain = true`.

1. `RevColumn<BCS, SF>`
Key members:
`field`, `settings`, width/autosizing properties and methods (`setWidth`, `setAutoWidthSizing`, `checkAutoWidthSizing`, `autoSizeWidth`, `loadSettings`).

1. `RevColumnAutoSizeableWidth<BCS, SF>`
Helper interface exposing `{ column, width }` for autosizing operations.

## Hover and Utility Contracts

1. `RevLinedHoverCell<BCS, SF>`
Key members:
`viewCell`, `mouseOverLeftLine`, `mouseOverTopLine`.
Includes helper `RevLinedHoverCell.isMouseOverLine(...)`.

1. `RevCellMetaSettings`
Key members:
overloaded `get(...)` for retrieving column or meta-derived properties.

For complete class/interface/enum/constant details, including every property and method signature, use the generated API Reference pages in the documentation sidebar.

