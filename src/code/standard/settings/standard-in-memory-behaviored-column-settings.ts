import {
    GridSettings,
    Halign,
    TextTruncateType
} from '../../grid/grid-public-api';
import { InMemoryBehavioredColumnSettings } from '../../settings-implementations/settings-implementations-public-api';
import { StandardAllGridSettings } from './standard-all-grid-settings';

/** @public */
export class StandardInMemoryBehavioredColumnSettings extends InMemoryBehavioredColumnSettings {
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
        this._cellPadding = settings.cellPadding;
        this._cellFocusedBorderColor = settings.cellFocusedBorderColor;
        this._cellHoverBackgroundColor = settings.cellHoverBackgroundColor;
        this._columnHoverBackgroundColor = settings.columnHoverBackgroundColor;
        this._columnHeaderFont = settings.columnHeaderFont;
        this._columnHeaderHorizontalAlign = settings.columnHeaderHorizontalAlign;
        this._columnHeaderBackgroundColor = settings.columnHeaderBackgroundColor;
        this._columnHeaderForegroundColor = settings.columnHeaderForegroundColor;
        this._columnHeaderSelectionFont = settings.columnHeaderSelectionFont;
        this._columnHeaderSelectionBackgroundColor = settings.columnHeaderSelectionBackgroundColor;
        this._columnHeaderSelectionForegroundColor = settings.columnHeaderSelectionForegroundColor;
        this._horizontalAlign = settings.horizontalAlign;
        this._verticalOffset = settings.verticalOffset;
        this._font = settings.font;
        this._textTruncateType = settings.textTruncateType;
        this._textStrikeThrough = settings.textStrikeThrough;
    }
}
