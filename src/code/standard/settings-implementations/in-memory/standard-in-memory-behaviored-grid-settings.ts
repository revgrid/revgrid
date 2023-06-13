import {
    GridSettings,
    Halign,
    TextTruncateType
} from '../../../grid/grid-public-api';
import { InMemoryBehavioredGridSettings } from '../../../settings-implementations/settings-implementations-public-api';
import { StandardAllGridSettings, StandardBehavioredGridSettings, StandardGridSettings } from '../../settings/standard-settings-public-api';

/** @public */
export class StandardInMemoryBehavioredGridSettings extends InMemoryBehavioredGridSettings implements StandardBehavioredGridSettings {
    private _cellPadding: number;
    private _cellFocusedBorderColor: GridSettings.Color | undefined;
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
    private _editorClickCursorName: string | undefined;

    get cellPadding() { return this._cellPadding; }
    set cellPadding(value: number) {
        if (value !== this._cellPadding) {
            this.beginChange();
            this._cellPadding = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get cellFocusedBorderColor() { return this._cellFocusedBorderColor; }
    set cellFocusedBorderColor(value: GridSettings.Color | undefined) {
        if (value !== this._cellFocusedBorderColor) {
            this.beginChange();
            this._cellFocusedBorderColor = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get cellHoverBackgroundColor() { return this._cellHoverBackgroundColor; }
    set cellHoverBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._cellHoverBackgroundColor) {
            this.beginChange();
            this._cellHoverBackgroundColor = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get columnHoverBackgroundColor() { return this._columnHoverBackgroundColor; }
    set columnHoverBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._columnHoverBackgroundColor) {
            this.beginChange();
            this._columnHoverBackgroundColor = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get columnHeaderFont() { return this._columnHeaderFont; }
    set columnHeaderFont(value: string) {
        if (value !== this._columnHeaderFont) {
            this.beginChange();
            this._columnHeaderFont = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get columnHeaderHorizontalAlign() { return this._columnHeaderHorizontalAlign; }
    set columnHeaderHorizontalAlign(value: Halign) {
        if (value !== this._columnHeaderHorizontalAlign) {
            this.beginChange();
            this._columnHeaderHorizontalAlign = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get columnHeaderBackgroundColor() { return this._columnHeaderBackgroundColor; }
    set columnHeaderBackgroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderBackgroundColor) {
            this.beginChange();
            this._columnHeaderBackgroundColor = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get columnHeaderForegroundColor() { return this._columnHeaderForegroundColor; }
    set columnHeaderForegroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderForegroundColor) {
            this.beginChange();
            this._columnHeaderForegroundColor = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get columnHeaderSelectionFont() { return this._columnHeaderSelectionFont; }
    set columnHeaderSelectionFont(value: string) {
        if (value !== this._columnHeaderSelectionFont) {
            this.beginChange();
            this._columnHeaderSelectionFont = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get columnHeaderSelectionBackgroundColor() { return this._columnHeaderSelectionBackgroundColor; }
    set columnHeaderSelectionBackgroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderSelectionBackgroundColor) {
            this.beginChange();
            this._columnHeaderSelectionBackgroundColor = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get columnHeaderSelectionForegroundColor() { return this._columnHeaderSelectionForegroundColor; }
    set columnHeaderSelectionForegroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderSelectionForegroundColor) {
            this.beginChange();
            this._columnHeaderSelectionForegroundColor = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get rowHoverBackgroundColor() { return this._rowHoverBackgroundColor; }
    set rowHoverBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._rowHoverBackgroundColor) {
            this.beginChange();
            this._rowHoverBackgroundColor = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get selectionFont() { return this._selectionFont; }
    set selectionFont(value: GridSettings.Color) {
        if (value !== this._selectionFont) {
            this.beginChange();
            this._selectionFont = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get selectionBackgroundColor() { return this._selectionBackgroundColor; }
    set selectionBackgroundColor(value: GridSettings.Color) {
        if (value !== this._selectionBackgroundColor) {
            this.beginChange();
            this._selectionBackgroundColor = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get selectionForegroundColor() { return this._selectionForegroundColor; }
    set selectionForegroundColor(value: GridSettings.Color) {
        if (value !== this._selectionForegroundColor) {
            this.beginChange();
            this._selectionForegroundColor = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get horizontalAlign() { return this._horizontalAlign; }
    set horizontalAlign(value: Halign) {
        if (value !== this._horizontalAlign) {
            this.beginChange();
            this._horizontalAlign = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get verticalOffset() { return this._verticalOffset; }
    set verticalOffset(value: number) {
        if (value !== this._verticalOffset) {
            this.beginChange();
            this._verticalOffset = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get font() { return this._font; }
    set font(value: string) {
        if (value !== this._font) {
            this.beginChange();
            this._font = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get textTruncateType() { return this._textTruncateType; }
    set textTruncateType(value: TextTruncateType | undefined) {
        if (value !== this._textTruncateType) {
            this.beginChange();
            this._textTruncateType = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get textStrikeThrough() { return this._textStrikeThrough; }
    set textStrikeThrough(value: boolean) {
        if (value !== this._textStrikeThrough) {
            this.beginChange();
            this._textStrikeThrough = value;
            this.invalidateViewRender();
            this.endChange();
        }
    }
    get editorClickCursorName() { return this._editorClickCursorName; }
    set editorClickCursorName(value: string | undefined) {
        if (value !== this._editorClickCursorName) {
            this.beginChange();
            this._editorClickCursorName = value;
            this.endChange();
        }
    }

    override load(settings: StandardAllGridSettings) {
        this.beginChange();

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
                case 'editorClickCursorName':
                    this._editorClickCursorName = settings.editorClickCursorName;
                    break;

                default: {
                    gridSettingsKey satisfies never;
                }
            }
        }

        this.endChange();
    }
}
