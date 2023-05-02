import { ColumnProperties, DataModel, GridProperties, RectangleInterface, ViewportCell, WritablePoint } from '../../grid/grid-public-api';
import { SimpleCellPaintConfig } from './simple-cell-paint-config';

/** @public */
export class SimpleCellPaintConfigAccessor implements SimpleCellPaintConfig {
    private readonly _gridProperties: GridProperties;
    private readonly _columnProperties: ColumnProperties;

    private readonly _dataOrHeaderOrFilterProperties: ColumnProperties.HeaderFilter;
    private readonly _dataOrHeaderProperties: ColumnProperties.ColumnHeader;
    private readonly _dataOrFilterProperties: ColumnProperties.Filter;

    constructor(beingPaintedCell: ViewportCell, isHeader: boolean, isFilter: boolean) {
        this._columnProperties = beingPaintedCell.visibleColumn.column.properties;
        this._gridProperties = beingPaintedCell.grid.properties;
        if (isHeader) {
            this._dataOrHeaderOrFilterProperties = this._columnProperties.columnHeader;
            this._dataOrHeaderProperties = this._columnProperties.columnHeader;
            this._dataOrFilterProperties = this._columnProperties;
        } else {
            if (isFilter) {
                this._dataOrHeaderOrFilterProperties = this._columnProperties.filterProperties;
                this._dataOrFilterProperties = this._columnProperties.filterProperties;
                this._dataOrHeaderProperties = this._columnProperties;
            } else {
                // must be data cell
                this._dataOrHeaderOrFilterProperties = this._columnProperties;
                this._dataOrHeaderProperties = this._columnProperties;
                this._dataOrFilterProperties = this._columnProperties;
            }
        }
    }

    dataCell: WritablePoint;
    gridCell: WritablePoint;
    allRowsSelected: boolean;
    bounds: RectangleInterface;
    dataRow: DataModel.DataRow;
    isCellHovered: boolean;
    isCellSelected: boolean;
    isColumnHovered: boolean;
    isColumnSelected: boolean;
    isDataColumn: boolean;
    isMainRow: boolean;
    isFilterRow: boolean;
    isHandleColumn: boolean;
    isHeaderRow: boolean;
    isInCurrentSelectionRectangle: boolean;
    isRowHovered: boolean;
    isRowFocused: boolean;
    isRowSelected: boolean;
    isSelected: boolean;
    isUserDataArea: boolean;
    prefillColor: GridProperties.Color | undefined;
    snapshot: SimpleCellPaintConfig.Snapshot | undefined; // BeingPaintedCell
    value: unknown;

    get backgroundSelectionColor() { return this._dataOrHeaderOrFilterProperties.backgroundSelectionColor; }
    get color() { return this._dataOrHeaderOrFilterProperties.color; }
    get foregroundSelectionColor() { return this._dataOrHeaderOrFilterProperties.foregroundSelectionColor; }
    get foregroundSelectionFont() { return this._dataOrHeaderProperties.foregroundSelectionFont; }
    get headerTextWrapping() { return this._gridProperties.headerTextWrapping; }
    get hoverCellHighlight() { return this._gridProperties.hoverCellHighlight; }
    get hoverColumnHighlight() { return this._gridProperties.hoverColumnHighlight; }
    get hoverRowHighlight() { return this._gridProperties.hoverRowHighlight; }
    get linkOnHover() { return this._gridProperties.linkOnHover; }
    get linkColor() { return this._gridProperties.linkColor; }
    get linkColorOnHover() { return this._gridProperties.linkColorOnHover; }
    get cellPainter() { return this._dataOrHeaderOrFilterProperties.cellPainter; }
    get strikeThrough() { return this._gridProperties.strikeThrough; }
    get textTruncateType() { return this._gridProperties.textTruncateType; }
    get voffset() { return this._gridProperties.voffset; }

    get columnName() { return this._columnProperties.name; }
    get cellPadding() { return this._columnProperties.cellPadding; }
    get columnAutosizing() { return this._columnProperties.columnAutosizing; }
    get font() { return this._dataOrHeaderOrFilterProperties.font; }
    get format() { return this._dataOrHeaderProperties.format; }
    get gridLinesHWidth() { return this._columnProperties.gridLinesHWidth; }
    get gridLinesVWidth() { return this._columnProperties.gridLinesVWidth; }
    get link() { return this._columnProperties.link; }

    get backgroundColor() { return this._dataOrHeaderOrFilterProperties.backgroundColor; }
    get halign() { return this._dataOrHeaderOrFilterProperties.halign; }
}
