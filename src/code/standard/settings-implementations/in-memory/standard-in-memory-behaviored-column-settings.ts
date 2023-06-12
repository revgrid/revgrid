import {
    GridSettings,
    Halign,
    TextTruncateType
} from '../../../grid/grid-public-api';
import { InMemoryBehavioredColumnSettings } from '../../../settings-implementations/settings-implementations-public-api';
import { StandardAllColumnSettings, StandardAllGridSettings, StandardBehavioredColumnSettings, StandardColumnSettings } from '../../settings/standard-settings-public-api';

/** @public */
export class StandardInMemoryBehavioredColumnSettings extends InMemoryBehavioredColumnSettings implements StandardBehavioredColumnSettings{
    declare gridSettings: StandardAllGridSettings;

    private _cellPadding: number | undefined;
    private _cellFocusedBorderColor: GridSettings.Color | undefined;
    private _cellHoverBackgroundColor: GridSettings.Color | undefined | null;
    private _columnHoverBackgroundColor: GridSettings.Color | undefined | null;
    private _columnHeaderFont: string | undefined;
    private _columnHeaderHorizontalAlign: Halign | undefined;
    private _columnHeaderBackgroundColor: GridSettings.Color | undefined;
    private _columnHeaderForegroundColor: GridSettings.Color | undefined;
    private _columnHeaderSelectionFont: string | undefined;
    private _columnHeaderSelectionBackgroundColor: GridSettings.Color | undefined;
    private _columnHeaderSelectionForegroundColor: GridSettings.Color | undefined;
    private _horizontalAlign: Halign | undefined;
    private _verticalOffset: number | undefined;
    private _font: string | undefined;
    private _textTruncateType: TextTruncateType | undefined | null;
    private _textStrikeThrough: boolean | undefined;
    private _editorClickCursorName: string | undefined | null;

    constructor(gridSettings: StandardAllGridSettings) {
        super(gridSettings);
    }

    get cellPadding() { return this._cellPadding !== undefined ? this._cellPadding : this.gridSettings.cellPadding; }
    set cellPadding(value: number) {
        if (value !== this._cellPadding) {
            this.beginChange();
            this._cellPadding = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get cellFocusedBorderColor() { return this._cellFocusedBorderColor !== undefined ? this._cellFocusedBorderColor : this.gridSettings.cellFocusedBorderColor; }
    set cellFocusedBorderColor(value: GridSettings.Color) {
        if (value !== this._cellFocusedBorderColor) {
            this.beginChange();
            this._cellFocusedBorderColor = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get cellHoverBackgroundColor() {
        if (this._cellHoverBackgroundColor === null) {
            return undefined;
        } else {
            return this._cellHoverBackgroundColor !== undefined ? this._cellHoverBackgroundColor : this.gridSettings.cellHoverBackgroundColor;
        }
    }
    set cellHoverBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._cellHoverBackgroundColor) {
            this.beginChange();
            if (value === undefined) {
                this._cellHoverBackgroundColor = null;
            } else {
                this._cellHoverBackgroundColor = value;
            }
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get columnHoverBackgroundColor() {
        if (this._columnHoverBackgroundColor === null) {
            return undefined;
        } else {
            return this._columnHoverBackgroundColor !== undefined ? this._columnHoverBackgroundColor : this.gridSettings.columnHoverBackgroundColor;
        }
    }
    set columnHoverBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._columnHoverBackgroundColor) {
            this.beginChange();
            if (value === undefined) {
                this._columnHoverBackgroundColor = null;
            } else {
                this._columnHoverBackgroundColor = value;
            }
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get columnHeaderFont() { return this._columnHeaderFont !== undefined ? this._columnHeaderFont : this.gridSettings.columnHeaderFont; }
    set columnHeaderFont(value: string) {
        if (value !== this._columnHeaderFont) {
            this.beginChange();
            this._columnHeaderFont = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get columnHeaderHorizontalAlign() {
        return this._columnHeaderHorizontalAlign !== undefined ? this._columnHeaderHorizontalAlign : this.gridSettings.columnHeaderHorizontalAlign;
    }
    set columnHeaderHorizontalAlign(value: Halign) {
        if (value !== this._columnHeaderHorizontalAlign) {
            this.beginChange();
            this._columnHeaderHorizontalAlign = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get columnHeaderBackgroundColor() { return this._columnHeaderBackgroundColor !== undefined ? this._columnHeaderBackgroundColor : this.gridSettings.columnHeaderBackgroundColor; }
    set columnHeaderBackgroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderBackgroundColor) {
            this.beginChange();
            this._columnHeaderBackgroundColor = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get columnHeaderForegroundColor() { return this._columnHeaderForegroundColor !== undefined ? this._columnHeaderForegroundColor : this.gridSettings.columnHeaderForegroundColor; }
    set columnHeaderForegroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderForegroundColor) {
            this.beginChange();
            this._columnHeaderForegroundColor = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get columnHeaderSelectionFont() { return this._columnHeaderSelectionFont !== undefined ? this._columnHeaderSelectionFont : this.gridSettings.columnHeaderSelectionFont; }
    set columnHeaderSelectionFont(value: string) {
        if (value !== this._columnHeaderSelectionFont) {
            this.beginChange();
            this._columnHeaderSelectionFont = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get columnHeaderSelectionBackgroundColor() {
        return this._columnHeaderSelectionBackgroundColor !== undefined ? this._columnHeaderSelectionBackgroundColor : this.gridSettings.columnHeaderSelectionBackgroundColor;
    }
    set columnHeaderSelectionBackgroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderSelectionBackgroundColor) {
            this.beginChange();
            this._columnHeaderSelectionBackgroundColor = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get columnHeaderSelectionForegroundColor() {
        return this._columnHeaderSelectionForegroundColor !== undefined ? this._columnHeaderSelectionForegroundColor : this.gridSettings.columnHeaderSelectionForegroundColor;
    }
    set columnHeaderSelectionForegroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderSelectionForegroundColor) {
            this.beginChange();
            this._columnHeaderSelectionForegroundColor = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get horizontalAlign() { return this._horizontalAlign !== undefined ? this._horizontalAlign : this.gridSettings.horizontalAlign; }
    set horizontalAlign(value: Halign) {
        if (value !== this._horizontalAlign) {
            this.beginChange();
            this._horizontalAlign = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get verticalOffset() { return this._verticalOffset !== undefined ? this._verticalOffset : this.gridSettings.verticalOffset; }
    set verticalOffset(value: number) {
        if (value !== this._verticalOffset) {
            this.beginChange();
            this._verticalOffset = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get font() { return this._font !== undefined ? this._font : this.gridSettings.font; }
    set font(value: string) {
        if (value !== this._font) {
            this.beginChange();
            this._font = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get textTruncateType() {
        if (this._textTruncateType === null) {
            return undefined;
        } else {
            return this._textTruncateType !== undefined ? this._textTruncateType : this.gridSettings.textTruncateType;
        }
    }
    set textTruncateType(value: TextTruncateType | undefined) {
        if (value !== this._textTruncateType) {
            this.beginChange();
            if (value === undefined) {
                this._textTruncateType = null;
            } else {
                this._textTruncateType = value;
            }
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get textStrikeThrough() { return this._textStrikeThrough !== undefined ? this._textStrikeThrough : this.gridSettings.textStrikeThrough; }
    set textStrikeThrough(value: boolean) {
        if (value !== this._textStrikeThrough) {
            this.beginChange();
            this._textStrikeThrough = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }

    get editorClickCursorName() {
        if (this._editorClickCursorName === null) {
            return undefined;
        } else {
            return this._editorClickCursorName !== undefined ? this._editorClickCursorName : this.gridSettings.editorClickCursorName;
        }
    }
    set editorClickCursorName(value: string | undefined) {
        if (value !== this._editorClickCursorName) {
            this.beginChange();
            if (this._editorClickCursorName === undefined) {
                this._editorClickCursorName = null;
            } else {
                this._editorClickCursorName = value;
            }
            this.endChange();
        }
    }

    override load(settings: StandardAllColumnSettings) {
        this.beginChange();

        super.load(settings);

        for (const key in settings) {
            // Use loop so that compiler will report error if any setting missing
            const columnSettingsKey = key as keyof StandardColumnSettings;
            switch (columnSettingsKey) {
                case 'cellPadding':
                    this._cellPadding = settings.cellPadding;
                    break;
                case 'cellFocusedBorderColor':
                    this._cellFocusedBorderColor = settings.cellFocusedBorderColor;
                    break;
                case 'cellHoverBackgroundColor':
                    this._cellHoverBackgroundColor = settings.cellHoverBackgroundColor;
                    break;
                case 'columnHoverBackgroundColor':
                    this._columnHoverBackgroundColor = settings.columnHoverBackgroundColor;
                    break;
                case 'columnHeaderFont':
                    this._columnHeaderFont = settings.columnHeaderFont;
                    break;
                case 'columnHeaderHorizontalAlign':
                    this._columnHeaderHorizontalAlign = settings.columnHeaderHorizontalAlign;
                    break;
                case 'columnHeaderBackgroundColor':
                    this._columnHeaderBackgroundColor = settings.columnHeaderBackgroundColor;
                    break;
                case 'columnHeaderForegroundColor':
                    this._columnHeaderForegroundColor = settings.columnHeaderForegroundColor;
                    break;
                case 'columnHeaderSelectionFont':
                    this._columnHeaderSelectionFont = settings.columnHeaderSelectionFont;
                    break;
                case 'columnHeaderSelectionBackgroundColor':
                    this._columnHeaderSelectionBackgroundColor = settings.columnHeaderSelectionBackgroundColor;
                    break;
                case 'columnHeaderSelectionForegroundColor':
                    this._columnHeaderSelectionForegroundColor = settings.columnHeaderSelectionForegroundColor;
                    break;
                case 'horizontalAlign':
                    this._horizontalAlign = settings.horizontalAlign;
                    break;
                case 'verticalOffset':
                    this._verticalOffset = settings.verticalOffset;
                    break;
                case 'font':
                    this._font = settings.font;
                    break;
                case 'textTruncateType':
                    this._textTruncateType = settings.textTruncateType;
                    break;
                case 'textStrikeThrough':
                    this._textStrikeThrough = settings.textStrikeThrough;
                    break;
                case 'editorClickCursorName':
                    this._editorClickCursorName = settings.editorClickCursorName;
                    break;

                default:
                    columnSettingsKey satisfies never;
            }
        }

        this.endChange();
    }
}
