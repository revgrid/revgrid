import {
    GridSettings,
    Halign,
    TextTruncateType
} from '../../../grid/grid-public-api';
import { InMemoryBehavioredGridSettings } from '../../../settings-implementations/settings-implementations-public-api';
import { StandardAllGridSettings, StandardGridSettings } from '../../settings/standard-settings-public-api';

/** @public */
export class StandardInMemoryBehavioredGridSettings extends InMemoryBehavioredGridSettings {
    private _cellPadding: number;
    private _cellFocusedBorderColor: GridSettings.Color;
    private _cellHoverBackgroundColor: GridSettings.Color | undefined;
    private _columnHoverBackgroundColor: GridSettings.Color | undefined;
    private _columnHeaderFont: string;
    private _columnHeaderHorizontalAlign: Halign;
    private _columnHeaderBackgroundColor: GridSettings.Color;
    private _columnHeaderForegroundColor: GridSettings.Color;
    private _columnHeaderSelectionFont: string;
    private _columnHeaderSelectionBackgroundColor: GridSettings.Color;
    private _columnHeaderSelectionForegroundColor: GridSettings.Color;
    private _rowHoverBackgroundColor: GridSettings.Color | undefined;
    private _selectionFont: GridSettings.Color;
    private _selectionBackgroundColor: GridSettings.Color;
    private _selectionForegroundColor: GridSettings.Color;
    private _horizontalAlign: Halign;
    private _verticalOffset: number;
    private _font: string;
    private _textTruncateType: TextTruncateType | undefined;
    private _textStrikeThrough: boolean;

    get cellPadding() { return this._cellPadding; }
    set cellPadding(value: number) {
        if (value !== this._cellPadding) {
            this._cellPadding = value;
            this.invalidateViewRender();
        }
    }
    get cellFocusedBorderColor() { return this._cellFocusedBorderColor; }
    set cellFocusedBorderColor(value: GridSettings.Color) {
        if (value !== this._cellFocusedBorderColor) {
            this._cellFocusedBorderColor = value;
            this.invalidateViewRender();
        }
    }
    get cellHoverBackgroundColor() { return this._cellHoverBackgroundColor; }
    set cellHoverBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._cellHoverBackgroundColor) {
            this._cellHoverBackgroundColor = value;
            this.invalidateViewRender();
        }
    }
    get columnHoverBackgroundColor() { return this._columnHoverBackgroundColor; }
    set columnHoverBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._columnHoverBackgroundColor) {
            this._columnHoverBackgroundColor = value;
            this.invalidateViewRender();
        }
    }
    get columnHeaderFont() { return this._columnHeaderFont; }
    set columnHeaderFont(value: string) {
        if (value !== this._columnHeaderFont) {
            this._columnHeaderFont = value;
            this.invalidateViewRender();
        }
    }
    get columnHeaderHorizontalAlign() { return this._columnHeaderHorizontalAlign; }
    set columnHeaderHorizontalAlign(value: Halign) {
        if (value !== this._columnHeaderHorizontalAlign) {
            this._columnHeaderHorizontalAlign = value;
            this.invalidateViewRender();
        }
    }
    get columnHeaderBackgroundColor() { return this._columnHeaderBackgroundColor; }
    set columnHeaderBackgroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderBackgroundColor) {
            this._columnHeaderBackgroundColor = value;
            this.invalidateViewRender();
        }
    }
    get columnHeaderForegroundColor() { return this._columnHeaderForegroundColor; }
    set columnHeaderForegroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderForegroundColor) {
            this._columnHeaderForegroundColor = value;
            this.invalidateViewRender();
        }
    }
    get columnHeaderSelectionFont() { return this._columnHeaderSelectionFont; }
    set columnHeaderSelectionFont(value: string) {
        if (value !== this._columnHeaderSelectionFont) {
            this._columnHeaderSelectionFont = value;
            this.invalidateViewRender();
        }
    }
    get columnHeaderSelectionBackgroundColor() { return this._columnHeaderSelectionBackgroundColor; }
    set columnHeaderSelectionBackgroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderSelectionBackgroundColor) {
            this._columnHeaderSelectionBackgroundColor = value;
            this.invalidateViewRender();
        }
    }
    get columnHeaderSelectionForegroundColor() { return this._columnHeaderSelectionForegroundColor; }
    set columnHeaderSelectionForegroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderSelectionForegroundColor) {
            this._columnHeaderSelectionForegroundColor = value;
            this.invalidateViewRender();
        }
    }
    get rowHoverBackgroundColor() { return this._rowHoverBackgroundColor; }
    set rowHoverBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._rowHoverBackgroundColor) {
            this._rowHoverBackgroundColor = value;
            this.invalidateViewRender();
        }
    }
    get selectionFont() { return this._selectionFont; }
    set selectionFont(value: GridSettings.Color) {
        if (value !== this._selectionFont) {
            this._selectionFont = value;
            this.invalidateViewRender();
        }
    }
    get selectionBackgroundColor() { return this._selectionBackgroundColor; }
    set selectionBackgroundColor(value: GridSettings.Color) {
        if (value !== this._selectionBackgroundColor) {
            this._selectionBackgroundColor = value;
            this.invalidateViewRender();
        }
    }
    get selectionForegroundColor() { return this._selectionForegroundColor; }
    set selectionForegroundColor(value: GridSettings.Color) {
        if (value !== this._selectionForegroundColor) {
            this._selectionForegroundColor = value;
            this.invalidateViewRender();
        }
    }
    get horizontalAlign() { return this._horizontalAlign; }
    set horizontalAlign(value: Halign) {
        if (value !== this._horizontalAlign) {
            this._horizontalAlign = value;
            this.invalidateViewRender();
        }
    }
    get verticalOffset() { return this._verticalOffset; }
    set verticalOffset(value: number) {
        if (value !== this._verticalOffset) {
            this._verticalOffset = value;
            this.invalidateViewRender();
        }
    }
    get font() { return this._font; }
    set font(value: string) {
        if (value !== this._font) {
            this._font = value;
            this.invalidateViewRender();
        }
    }
    get textTruncateType() { return this._textTruncateType; }
    set textTruncateType(value: TextTruncateType | undefined) {
        if (value !== this._textTruncateType) {
            this._textTruncateType = value;
            this.invalidateViewRender();
        }
    }
    get textStrikeThrough() { return this._textStrikeThrough; }
    set textStrikeThrough(value: boolean) {
        if (value !== this._textStrikeThrough) {
            this._textStrikeThrough = value;
            this.invalidateViewRender();
        }
    }

    override load(settings: StandardAllGridSettings) {
        super.load(settings);

        for (const key in settings) {
            // Use loop so that compiler will report error if any setting missing
            const gridSettingsKey = key as keyof StandardGridSettings;
            switch (gridSettingsKey) {
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
                case 'rowHoverBackgroundColor':
                    this._rowHoverBackgroundColor = settings.rowHoverBackgroundColor;
                    break;
                case 'selectionFont':
                    this._selectionFont = settings.selectionFont;
                    break;
                case 'selectionBackgroundColor':
                    this._selectionBackgroundColor = settings.selectionBackgroundColor;
                    break;
                case 'selectionForegroundColor':
                    this._selectionForegroundColor = settings.selectionForegroundColor;
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

                default: {
                    gridSettingsKey satisfies never;
                }
            }
        }
    }
}
