---
title: Grid Classes
---

# Grid Classes

The diagram below shows Grid classes within Revgrid:

![Revgrid grid classes](revgrid-grids.excalidraw.svg)

The colors indicate the module in which the class is declared:
* **blue**: [Client](../../client/index.md)
* **yellow**: [Column Layout](../../servers/column-layout/index.md)
* **grey**: [Record](../../servers/record/index.md)
* **light mint green**: [Data Row Array](../../servers/data-row-array/index.md)
* **green**: [Sourced Field](../../servers/sourced-field/index.md)
* **pink**: [Simple](../../libraries/simple/index.md)
* **purple**: [JavaScript](../../libraries/javascript/index.md)

Grid classes inherit from classes below them in the diagram.  Note that {@link sourced-field/sourced-field/sourced-field-grid!RevSourcedFieldGrid:interface RevSourcedFieldGrid} is an interface which is implemented by grid classes above it in the diagram.

## Brief description

* **{@link client/client-grid!RevClientGrid:class RevClientGrid}**\
The base grid which draws on the canvas using data supplied from server and handles UI.  All other grid classes are sub classes of RevClientGrid.  This grid class does not include any server code.
* **{@link column-layout/column-layout-grid!RevColumnLayoutGrid:class RevColumnLayoutGrid}** ← *{@link client/client-grid!RevClientGrid:class RevClientGrid}*\
Adds behavior to support [column layouts](../../servers/column-layout/index.md).
* **{@link data-row-array/data-row-array-grid!RevDataRowArrayGrid:class RevDataRowArrayGrid}** ← *{@link column-layout/column-layout-grid!RevColumnLayoutGrid:class RevColumnLayoutGrid}*\
Uses [Data Row Array](../../servers/data-row-array/index.md) schema server ({@link data-row-array/server/data-row-array-schema-server!RevDataRowArraySchemaServer:class RevDataRowArraySchemaServer}) and data server ({@link data-row-array/server/data-row-array-data-server!RevDataRowArrayDataServer RevDataRowArrayDataServer}).
* **{@link record/record-grid!RevRecordGrid:class RevRecordGrid}** ← *{@link column-layout/column-layout-grid!RevColumnLayoutGrid:class RevColumnLayoutGrid}*\
Uses [Record](../../servers/record/index.md) schema server ({@link record/server/record-schema-server!RevRecordSchemaServer:class RevRecordSchemaServer}) and data server ({@link record/server/record-data-server!RevRecordDataServer:class RevRecordDataServer}).
* **{@link sourced-field/sourced-field/sourced-field-grid!RevSourcedFieldGrid:interface RevSourcedFieldGrid}** ← *{@link column-layout/column-layout-grid!RevColumnLayoutGrid:class RevColumnLayoutGrid}*\
An interface which specifies support for allowed fields. All [Sourced Field](../../servers/sourced-field/index.md) grid classes (and their descendants) implement this interface.
* **{@link sourced-field/record/record/record-sourced-field-grid!RevRecordSourcedFieldGrid:class RevRecordSourcedFieldGrid}** ← *{@link record/record-grid!RevRecordGrid:class RevRecordGrid}*\
Implements {@link sourced-field/sourced-field/sourced-field-grid!RevSourcedFieldGrid:interface RevSourcedFieldGrid} interface.
* **{@link sourced-field/record/table/table-grid!RevTableGrid:class RevTableGrid}** ← *{@link sourced-field/record/record/record-sourced-field-grid!RevRecordSourcedFieldGrid:class RevRecordSourcedFieldGrid}*\
Uses [Table](../../servers/table/index.md) record store ({@link sourced-field/record/table/server/table/table-record-store!RevTableRecordStore:class RevTableRecordStore}) with {@link sourced-field/record/table/server/data-source/data-source!RevDataSource:class RevDataSource} and {@link sourced-field/record/table/server/table/table!RevTable:class RevTable}.
* **{@link sourced-field/data-row-array/single-heading/single-heading-data-row-array-sourced-field-grid!RevSingleHeadingDataRowArraySourcedFieldGrid:class RevSingleHeadingDataRowArraySourcedFieldGrid}** ← *{@link data-row-array/data-row-array-grid!RevDataRowArrayGrid:class RevDataRowArrayGrid}*\
A single heading [Data Row Array](../../servers/data-row-array/index.md) grid with built in [definition](../../client/grid/definition/index.md) which creates a {@link data-row-array/server/data-row-array-schema-server!RevDataRowArraySchemaServer:class RevDataRowArraySchemaServer} schema server and 2 subgrids: main and header.  The main subgrid uses {@link data-row-array/server/data-row-array-data-server!RevDataRowArrayDataServer RevDataRowArrayDataServer}. The header subgrid uses {@link header/server/single-heading/single-heading-data-server!RevSingleHeadingDataServer:class RevSingleHeadingDataServer}. The cell painters used by the subgrids are passed as parameters in the constructor.
* **{@link sourced-field/data-row-array/multi-heading/multi-heading-data-row-array-sourced-field-grid!RevMultiHeadingDataRowArraySourcedFieldGrid:class RevMultiHeadingDataRowArraySourcedFieldGrid}** ← *{@link data-row-array/data-row-array-grid!RevDataRowArrayGrid:class RevDataRowArrayGrid}*\
A multi heading [Data Row Array](../../servers/data-row-array/index.md) grid with built in [definition](../../client/grid/definition/index.md) which creates a {@link data-row-array/server/data-row-array-schema-server!RevDataRowArraySchemaServer:class RevDataRowArraySchemaServer} schema server and 2 subgrids: main and header.  The main subgrid uses {@link data-row-array/server/data-row-array-data-server!RevDataRowArrayDataServer RevDataRowArrayDataServer}. The header subgrid uses {@link header/server/multi-heading/multi-heading-data-server!RevMultiHeadingDataServer:class RevMultiHeadingDataServer}. The cell painters used by the subgrids are passed as parameters in the constructor.
* **{@link simple/simple-client-grid!RevSimpleClientGrid:class RevSimpleClientGrid}** ← *{@link client/client-grid!RevClientGrid:class RevClientGrid}*\
Client grid which uses `Simple` in-memory [grid settings](../../settings/simple/index.md) ({@link simple/settings-implementations/in-memory/simple-in-memory-behaviored-grid-settings!RevSimpleInMemoryBehavioredGridSettings:class RevSimpleInMemoryBehavioredGridSettings}, {@link simple/settings-implementations/in-memory/simple-in-memory-behaviored-column-settings!RevSimpleInMemoryBehavioredColumnSettings:class RevSimpleInMemoryBehavioredColumnSettings}).
* **{@link simple/simple-data-row-array-grid!RevSimpleDataRowArrayGrid:class RevSimpleDataRowArrayGrid}** ← *{@link data-row-array/data-row-array-grid!RevDataRowArrayGrid:class RevDataRowArrayGrid}*\
A single heading [Data Row Array](../../servers/data-row-array/index.md) grid with built in [definition](../../client/grid/definition/index.md) which creates a {@link data-row-array/server/data-row-array-schema-server!RevDataRowArraySchemaServer:class RevDataRowArraySchemaServer} schema server and 2 subgrids: main and header.  The main subgrid uses {@link data-row-array/server/data-row-array-data-server!RevDataRowArrayDataServer RevDataRowArrayDataServer} and {@link simple/cell-painter/simple-alpha-text-cell-painter!RevSimpleAlphaTextCellPainter:class RevSimpleAlphaTextCellPainter}. The header subgrid uses {@link header/server/single-heading/single-heading-data-server!RevSingleHeadingDataServer:class RevSingleHeadingDataServer} and {@link standard/cell-painter/standard-header-text-cell-painter!RevStandardHeaderTextCellPainter:class RevStandardHeaderTextCellPainter}. The grid uses `Simple` in-memory [grid settings](../../settings/simple/index.md).
* **{@link js/in-memory-settings-client-grid!RevInMemorySettingsClientGrid:class RevInMemorySettingsClientGrid}** ← *{@link client/client-grid!RevClientGrid:class RevClientGrid}*\
A client grid without generic parameters which can be used in JavaScript applications.
* **{@link js/symbol-table-grid!RevSymbolTableGrid:class RevSymbolTableGrid}** ← *{@link sourced-field/record/table/table-grid!RevTableGrid:class RevTableGrid}*\
A table grid without generic parameters which can be used in JavaScript applications.
