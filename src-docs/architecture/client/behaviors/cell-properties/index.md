---
title: Cell Properties Behavior
---

Cell-properties behavior resolves effective cell-level configuration.

It combines schema, column settings, and cell metadata to answer questions such as editability, painter/editor choice, and interaction eligibility.

## Primary Class

{@link client/behavior/cell-properties-behavior!RevCellPropertiesBehavior:class RevCellPropertiesBehavior}

## Key Members

1. getCellPropertiesAccessor(...): Returns effective cell settings accessor (cell own properties layered on top of column settings).
1. getCellProperty(...): Typed property lookup for either column-setting keys or row metadata keys.
1. setCellProperty(...): Writes one cell property and clears cached cell-own-properties state for visible cells.
1. setCellOwnProperties(...), addCellOwnProperties(...), deleteCellOwnProperties(...): Bulk or full-replacement metadata operations.
1. clearAllCellProperties(...): Clears per-cell overrides for one column or all columns across all subgrids.
1. getCellOwnPropertiesFromViewCell(...), getCellOwnPropertyFromViewCell(...): View-cell cache-aware metadata accessors.

## Related Types

1. {@link client/interfaces/cell-meta-settings!RevCellMetaSettings:interface RevCellMetaSettings}
1. {@link common/server-interfaces/meta/meta-server!RevMetaServer:type RevMetaServer}
