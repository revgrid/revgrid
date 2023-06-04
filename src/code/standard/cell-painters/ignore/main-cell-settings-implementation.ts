import { CellPainterColumn } from '../cell-painter-column';
import { CellPainterColumnSettings } from '../cell-painter-column-settings';
import { CellPainterGridSettings } from '../cell-painter-grid-settings';
import { MainCellSettings } from './main-cell-settings';

/** @internal */
export class MainCellSettingsImplementation implements MainCellSettings {
    private _gridSettings: CellPainterGridSettings;
    private _columnSettings: CellPainterColumnSettings;

    private _columnName: string;

    setColumn(column: CellPainterColumn) {
        this._columnName = column.name;
        const columnSettings = column.settings;
        this._columnSettings = columnSettings;
        this._gridSettings = this._columnSettings.gridSettings;

        this._columnSettings = columnSettings;
    }

    get columnName() { return this._columnName; }

    get focusedCellBorderColor() { return this._gridSettings.focusedCellBorderColor; }
    get cellHoverBackgroundColor() { return this._gridSettings.cellHoverBackgroundColor; }
    get columnHoverBackgroundColors() { return this._gridSettings.columnHoverBackgroundColors; }
    get rowHoverBackgroundColor() { return this._gridSettings.rowHoverBackgroundColor; }
    get linkOnHover() { return this._gridSettings.linkOnHover; }
    get linkColor() { return this._gridSettings.linkColor; }
    get linkColorOnHover() { return this._gridSettings.linkColorOnHover; }
    get strikeThrough() { return this._gridSettings.strikeThrough; }
    get textTruncateType() { return this._gridSettings.textTruncateType; }
    get voffset() { return this._gridSettings.voffset; }

    get backgroundSelectionColor() { return this._columnSettings.backgroundSelectionColor; }
    get color() { return this._columnSettings.color; }
    get foregroundSelectionColor() { return this._columnSettings.foregroundSelectionColor; }
    get foregroundSelectionFont() { return this._columnSettings.foregroundSelectionFont; }
    get cellPadding() { return this._columnSettings.cellPadding; }
    get columnAutosizing() { return this._columnSettings.columnAutosizing; }
    get font() { return this._columnSettings.font; }
    get format() { return this._columnSettings.format; }
    get gridLinesHWidth() { return this._columnSettings.gridLinesHWidth; }
    get gridLinesVWidth() { return this._columnSettings.gridLinesVWidth; }
    get link() { return this._columnSettings.link; }

    get backgroundColor() { return this._columnSettings.backgroundColor; }
    get halign() { return this._columnSettings.halign; }
}
