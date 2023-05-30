import { Column } from '../interfaces/schema/column';
import { CellSettings } from '../interfaces/settings/cell-settings';
import { ColumnSettings } from '../interfaces/settings/column-settings';
import { GridSettings } from '../interfaces/settings/grid-settings';

/** @internal */
export class CellSettingsImplementation implements CellSettings {
    private _gridSettings: GridSettings;
    private _columnSettings: ColumnSettings;

    private _dataOrHeaderOrFilterSettings: ColumnSettings.HeaderFilter;
    private _dataOrHeaderSettings: ColumnSettings.Header;
    private _dataOrFilterSettings: ColumnSettings.Filter;

    private _columnName: string;

    setColumn(column: Column, isHeader: boolean, isFilter: boolean) {
        this._columnName = column.name;
        const columnSettings = column.settings;
        this._columnSettings = columnSettings;
        this._gridSettings = this._columnSettings.gridSettings;

        if (isHeader) {
            this._dataOrHeaderOrFilterSettings = columnSettings.header;
            this._dataOrHeaderSettings = columnSettings.header;
            this._dataOrFilterSettings = columnSettings;
        } else {
            if (isFilter) {
                this._dataOrHeaderOrFilterSettings = columnSettings.filter;
                this._dataOrFilterSettings = columnSettings.filter;
                this._dataOrHeaderSettings = columnSettings;
            } else {
                // must be data cell
                this._dataOrHeaderOrFilterSettings = columnSettings;
                this._dataOrHeaderSettings = columnSettings;
                this._dataOrFilterSettings = columnSettings;
            }
        }
    }

    // dataCell: WritablePoint;
    // allRowsSelected: boolean;
    // bounds: RectangleInterface;
    // dataRow: DataServer.DataRow;
    // isCellFocused: boolean;
    // isCellHovered: boolean;
    // isCellSelected: boolean;
    // isColumnHovered: boolean;
    // isColumnSelected: boolean;
    // isDataColumn: boolean;
    // isMainRow: boolean;
    // isFilterRow: boolean;
    // isHandleColumn: boolean;
    // isHeaderRow: boolean;
    // isRowHovered: boolean;
    // isRowFocused: boolean;
    // isRowSelected: boolean;
    // isSelected: boolean;
    // isUserDataArea: boolean;
    // prefillColor: GridSettings.Color | undefined;
    // snapshot: SimpleCellPaintConfig.Snapshot | undefined; // BeingPaintedCell
    // value: unknown;

    get columnName() { return this._columnName; }

    get focusedCellBorderColor() { return this._gridSettings.focusedCellBorderColor; }
    get backgroundSelectionColor() { return this._dataOrHeaderOrFilterSettings.backgroundSelectionColor; }
    get color() { return this._dataOrHeaderOrFilterSettings.color; }
    get foregroundSelectionColor() { return this._dataOrHeaderOrFilterSettings.foregroundSelectionColor; }
    get foregroundSelectionFont() { return this._dataOrHeaderSettings.foregroundSelectionFont; }
    get headerTextWrapping() { return this._gridSettings.headerTextWrapping; }
    get hoverCellHighlight() { return this._gridSettings.hoverCellHighlight; }
    get hoverColumnHighlight() { return this._gridSettings.hoverColumnHighlight; }
    get hoverRowHighlight() { return this._gridSettings.hoverRowHighlight; }
    get linkOnHover() { return this._gridSettings.linkOnHover; }
    get linkColor() { return this._gridSettings.linkColor; }
    get linkColorOnHover() { return this._gridSettings.linkColorOnHover; }
    get strikeThrough() { return this._gridSettings.strikeThrough; }
    get textTruncateType() { return this._gridSettings.textTruncateType; }
    get voffset() { return this._gridSettings.voffset; }

    get cellPadding() { return this._columnSettings.cellPadding; }
    get columnAutosizing() { return this._columnSettings.columnAutosizing; }
    get font() { return this._dataOrHeaderOrFilterSettings.font; }
    get format() { return this._dataOrHeaderSettings.format; }
    get gridLinesHWidth() { return this._columnSettings.gridLinesHWidth; }
    get gridLinesVWidth() { return this._columnSettings.gridLinesVWidth; }
    get link() { return this._columnSettings.link; }

    get backgroundColor() { return this._dataOrHeaderOrFilterSettings.backgroundColor; }
    get halign() { return this._dataOrHeaderOrFilterSettings.halign; }
}
