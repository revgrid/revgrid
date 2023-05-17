import { ColumnSettings, DataModel, GridSettings, RectangleInterface, Revgrid, ViewCell, WritablePoint } from '../../grid/grid-public-api';
import { SimpleCellPaintConfig } from './simple-cell-paint-config';

/** @public */
export class SimpleCellPaintConfigAccessor implements SimpleCellPaintConfig {
    readonly columnName: string;

    private readonly _gridSettings: GridSettings;
    private readonly _columnSettings: ColumnSettings;

    private readonly _dataOrHeaderOrFilterProperties: ColumnSettings.HeaderFilter;
    private readonly _dataOrHeaderProperties: ColumnSettings.ColumnHeader;
    private readonly _dataOrFilterProperties: ColumnSettings.Filter;

    constructor(grid: Revgrid, viewCell: ViewCell, isHeader: boolean, isFilter: boolean) {
        this._gridSettings = grid.settings;
        const column = viewCell.viewLayoutColumn.column;
        this._columnSettings = column.settings;
        this.columnName = column.name;
        if (isHeader) {
            this._dataOrHeaderOrFilterProperties = this._columnSettings.columnHeader;
            this._dataOrHeaderProperties = this._columnSettings.columnHeader;
            this._dataOrFilterProperties = this._columnSettings;
        } else {
            if (isFilter) {
                this._dataOrHeaderOrFilterProperties = this._columnSettings.filterProperties;
                this._dataOrFilterProperties = this._columnSettings.filterProperties;
                this._dataOrHeaderProperties = this._columnSettings;
            } else {
                // must be data cell
                this._dataOrHeaderOrFilterProperties = this._columnSettings;
                this._dataOrHeaderProperties = this._columnSettings;
                this._dataOrFilterProperties = this._columnSettings;
            }
        }
    }

    dataCell: WritablePoint;
    allRowsSelected: boolean;
    bounds: RectangleInterface;
    dataRow: DataModel.DataRow;
    isCellFocused: boolean;
    isCellHovered: boolean;
    isCellSelected: boolean;
    isColumnHovered: boolean;
    isColumnSelected: boolean;
    isDataColumn: boolean;
    isMainRow: boolean;
    isFilterRow: boolean;
    isHandleColumn: boolean;
    isHeaderRow: boolean;
    isRowHovered: boolean;
    isRowFocused: boolean;
    isRowSelected: boolean;
    isSelected: boolean;
    isUserDataArea: boolean;
    prefillColor: GridSettings.Color | undefined;
    snapshot: SimpleCellPaintConfig.Snapshot | undefined; // BeingPaintedCell
    value: unknown;

    get focusedCellBorderColor() { return this._gridSettings.focusedCellBorderColor; }
    get backgroundSelectionColor() { return this._dataOrHeaderOrFilterProperties.backgroundSelectionColor; }
    get color() { return this._dataOrHeaderOrFilterProperties.color; }
    get foregroundSelectionColor() { return this._dataOrHeaderOrFilterProperties.foregroundSelectionColor; }
    get foregroundSelectionFont() { return this._dataOrHeaderProperties.foregroundSelectionFont; }
    get headerTextWrapping() { return this._gridSettings.headerTextWrapping; }
    get hoverCellHighlight() { return this._gridSettings.hoverCellHighlight; }
    get hoverColumnHighlight() { return this._gridSettings.hoverColumnHighlight; }
    get hoverRowHighlight() { return this._gridSettings.hoverRowHighlight; }
    get linkOnHover() { return this._gridSettings.linkOnHover; }
    get linkColor() { return this._gridSettings.linkColor; }
    get linkColorOnHover() { return this._gridSettings.linkColorOnHover; }
    get cellPainter() { return this._dataOrHeaderOrFilterProperties.cellPainter; }
    get strikeThrough() { return this._gridSettings.strikeThrough; }
    get textTruncateType() { return this._gridSettings.textTruncateType; }
    get voffset() { return this._gridSettings.voffset; }

    get cellPadding() { return this._columnSettings.cellPadding; }
    get columnAutosizing() { return this._columnSettings.columnAutosizing; }
    get font() { return this._dataOrHeaderOrFilterProperties.font; }
    get format() { return this._dataOrHeaderProperties.format; }
    get gridLinesHWidth() { return this._columnSettings.gridLinesHWidth; }
    get gridLinesVWidth() { return this._columnSettings.gridLinesVWidth; }
    get link() { return this._columnSettings.link; }

    get backgroundColor() { return this._dataOrHeaderOrFilterProperties.backgroundColor; }
    get halign() { return this._dataOrHeaderOrFilterProperties.halign; }
}
