import {
    GridSettings
} from '../../../client/internal-api';
import { InMemoryBehavioredGridSettings } from '../../../settings-implementations/internal-api';
import { HorizontalAlign, TextTruncateType } from '../../painters/internal-api';
import { StandardBehavioredGridSettings, StandardGridSettings, StandardOnlyGridSettings } from '../../settings/internal-api';

/** @public */
export class InMemoryStandardBehavioredGridSettings extends InMemoryBehavioredGridSettings implements StandardBehavioredGridSettings {
    private _cellPadding: number;
    private _cellFocusedBorderColor: GridSettings.Color | undefined;
    private _cellHoverBackgroundColor: GridSettings.Color | undefined;
    private _columnHoverBackgroundColor: GridSettings.Color | undefined;
    private _columnHeaderFont: string | undefined;
    private _columnHeaderHorizontalAlign: HorizontalAlign | undefined;
    private _columnHeaderBackgroundColor: GridSettings.Color | undefined;
    private _columnHeaderForegroundColor: GridSettings.Color | undefined;
    private _columnHeaderSelectionFont: string | undefined;
    private _columnHeaderSelectionBackgroundColor: GridSettings.Color | undefined;
    private _columnHeaderSelectionForegroundColor: GridSettings.Color | undefined;
    private _rowHoverBackgroundColor: GridSettings.Color | undefined;
    private _selectionFont: GridSettings.Color | undefined;
    private _selectionBackgroundColor: GridSettings.Color | undefined;
    private _selectionForegroundColor: GridSettings.Color | undefined;
    private _font: string;
    private _horizontalAlign: HorizontalAlign;
    private _verticalOffset: number;
    private _textTruncateType: TextTruncateType | undefined;
    private _textStrikeThrough: boolean;

    get cellPadding() { return this._cellPadding; }
    set cellPadding(value: number) {
        if (value !== this._cellPadding) {
            this.beginChange();
            this._cellPadding = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get cellFocusedBorderColor() { return this._cellFocusedBorderColor; }
    set cellFocusedBorderColor(value: GridSettings.Color | undefined) {
        if (value !== this._cellFocusedBorderColor) {
            this.beginChange();
            this._cellFocusedBorderColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get cellHoverBackgroundColor() { return this._cellHoverBackgroundColor; }
    set cellHoverBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._cellHoverBackgroundColor) {
            this.beginChange();
            this._cellHoverBackgroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHoverBackgroundColor() { return this._columnHoverBackgroundColor; }
    set columnHoverBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._columnHoverBackgroundColor) {
            this.beginChange();
            this._columnHoverBackgroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderFont() { return this._columnHeaderFont; }
    set columnHeaderFont(value: string | undefined) {
        if (value !== this._columnHeaderFont) {
            this.beginChange();
            this._columnHeaderFont = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderHorizontalAlign() { return this._columnHeaderHorizontalAlign; }
    set columnHeaderHorizontalAlign(value: HorizontalAlign | undefined) {
        if (value !== this._columnHeaderHorizontalAlign) {
            this.beginChange();
            this._columnHeaderHorizontalAlign = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderBackgroundColor() { return this._columnHeaderBackgroundColor; }
    set columnHeaderBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._columnHeaderBackgroundColor) {
            this.beginChange();
            this._columnHeaderBackgroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderForegroundColor() { return this._columnHeaderForegroundColor; }
    set columnHeaderForegroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._columnHeaderForegroundColor) {
            this.beginChange();
            this._columnHeaderForegroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderSelectionFont() { return this._columnHeaderSelectionFont; }
    set columnHeaderSelectionFont(value: string | undefined) {
        if (value !== this._columnHeaderSelectionFont) {
            this.beginChange();
            this._columnHeaderSelectionFont = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderSelectionBackgroundColor() { return this._columnHeaderSelectionBackgroundColor; }
    set columnHeaderSelectionBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._columnHeaderSelectionBackgroundColor) {
            this.beginChange();
            this._columnHeaderSelectionBackgroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderSelectionForegroundColor() { return this._columnHeaderSelectionForegroundColor; }
    set columnHeaderSelectionForegroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._columnHeaderSelectionForegroundColor) {
            this.beginChange();
            this._columnHeaderSelectionForegroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get rowHoverBackgroundColor() { return this._rowHoverBackgroundColor; }
    set rowHoverBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._rowHoverBackgroundColor) {
            this.beginChange();
            this._rowHoverBackgroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get selectionFont() { return this._selectionFont; }
    set selectionFont(value: GridSettings.Color | undefined) {
        if (value !== this._selectionFont) {
            this.beginChange();
            this._selectionFont = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get selectionBackgroundColor() { return this._selectionBackgroundColor; }
    set selectionBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._selectionBackgroundColor) {
            this.beginChange();
            this._selectionBackgroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get selectionForegroundColor() { return this._selectionForegroundColor; }
    set selectionForegroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._selectionForegroundColor) {
            this.beginChange();
            this._selectionForegroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get font() { return this._font; }
    set font(value: string) {
        if (value !== this._font) {
            this.beginChange();
            this._font = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get horizontalAlign() { return this._horizontalAlign; }
    set horizontalAlign(value: HorizontalAlign) {
        if (value !== this._horizontalAlign) {
            this.beginChange();
            this._horizontalAlign = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get verticalOffset() { return this._verticalOffset; }
    set verticalOffset(value: number) {
        if (value !== this._verticalOffset) {
            this.beginChange();
            this._verticalOffset = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get textTruncateType() { return this._textTruncateType; }
    set textTruncateType(value: TextTruncateType | undefined) {
        if (value !== this._textTruncateType) {
            this.beginChange();
            this._textTruncateType = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get textStrikeThrough() { return this._textStrikeThrough; }
    set textStrikeThrough(value: boolean) {
        if (value !== this._textStrikeThrough) {
            this.beginChange();
            this._textStrikeThrough = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }

    override merge(settings: Partial<StandardGridSettings>) {
        this.beginChange();

        super.merge(settings);

        const requiredSettings = settings as Required<StandardGridSettings>; // since we only iterate over keys that exist we can assume that settings is not partial in the switch loop
        for (const key in settings) {
            // Use loop so that compiler will report error if any setting missing
            const gridSettingsKey = key as keyof StandardOnlyGridSettings;
            switch (gridSettingsKey) {
                case 'cellPadding':
                    if (this._cellPadding !== requiredSettings.cellPadding) {
                        this._cellPadding = requiredSettings.cellPadding;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'cellFocusedBorderColor':
                    if (this._cellFocusedBorderColor !== requiredSettings.cellFocusedBorderColor) {
                        this._cellFocusedBorderColor = requiredSettings.cellFocusedBorderColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'cellHoverBackgroundColor':
                    if (this._cellHoverBackgroundColor !== requiredSettings.cellHoverBackgroundColor) {
                        this._cellHoverBackgroundColor = requiredSettings.cellHoverBackgroundColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'columnHoverBackgroundColor':
                    if (this._columnHoverBackgroundColor !== requiredSettings.columnHoverBackgroundColor) {
                        this._columnHoverBackgroundColor = requiredSettings.columnHoverBackgroundColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'columnHeaderFont':
                    if (this._columnHeaderFont !== requiredSettings.columnHeaderFont) {
                        this._columnHeaderFont = requiredSettings.columnHeaderFont;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'columnHeaderHorizontalAlign':
                    if (this._columnHeaderHorizontalAlign !== requiredSettings.columnHeaderHorizontalAlign) {
                        this._columnHeaderHorizontalAlign = requiredSettings.columnHeaderHorizontalAlign;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'columnHeaderBackgroundColor':
                    if (this._columnHeaderBackgroundColor !== requiredSettings.columnHeaderBackgroundColor) {
                        this._columnHeaderBackgroundColor = requiredSettings.columnHeaderBackgroundColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'columnHeaderForegroundColor':
                    if (this._columnHeaderForegroundColor !== requiredSettings.columnHeaderForegroundColor) {
                        this._columnHeaderForegroundColor = requiredSettings.columnHeaderForegroundColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'columnHeaderSelectionFont':
                    if (this._columnHeaderSelectionFont !== requiredSettings.columnHeaderSelectionFont) {
                        this._columnHeaderSelectionFont = requiredSettings.columnHeaderSelectionFont;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'columnHeaderSelectionBackgroundColor':
                    if (this._columnHeaderSelectionBackgroundColor !== requiredSettings.columnHeaderSelectionBackgroundColor) {
                        this._columnHeaderSelectionBackgroundColor = requiredSettings.columnHeaderSelectionBackgroundColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'columnHeaderSelectionForegroundColor':
                    if (this._columnHeaderSelectionForegroundColor !== requiredSettings.columnHeaderSelectionForegroundColor) {
                        this._columnHeaderSelectionForegroundColor = requiredSettings.columnHeaderSelectionForegroundColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'rowHoverBackgroundColor':
                    if (this._rowHoverBackgroundColor !== requiredSettings.rowHoverBackgroundColor) {
                        this._rowHoverBackgroundColor = requiredSettings.rowHoverBackgroundColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'selectionFont':
                    if (this._selectionFont !== requiredSettings.selectionFont) {
                        this._selectionFont = requiredSettings.selectionFont;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'selectionBackgroundColor':
                    if (this._selectionBackgroundColor !== requiredSettings.selectionBackgroundColor) {
                        this._selectionBackgroundColor = requiredSettings.selectionBackgroundColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'selectionForegroundColor':
                    if (this._selectionForegroundColor !== requiredSettings.selectionForegroundColor) {
                        this._selectionForegroundColor = requiredSettings.selectionForegroundColor;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'font':
                    if (this._font !== requiredSettings.font) {
                        this._font = requiredSettings.font;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'horizontalAlign':
                    if (this._horizontalAlign !== requiredSettings.horizontalAlign) {
                        this._horizontalAlign = requiredSettings.horizontalAlign;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'verticalOffset':
                    if (this._verticalOffset !== requiredSettings.verticalOffset) {
                        this._verticalOffset = requiredSettings.verticalOffset;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'textTruncateType':
                    if (this._textTruncateType !== requiredSettings.textTruncateType) {
                        this._textTruncateType = requiredSettings.textTruncateType;
                        this.flagChangedViewRender();
                    }
                    break;
                case 'textStrikeThrough':
                    if (this._textStrikeThrough !== requiredSettings.textStrikeThrough) {
                        this._textStrikeThrough = requiredSettings.textStrikeThrough;
                        this.flagChangedViewRender();
                    }
                    break;

                default: {
                    gridSettingsKey satisfies never;
                }
            }
        }

        return this.endChange();
    }

    override clone() {
        const copy = new InMemoryStandardBehavioredGridSettings();
        copy.merge(this);
        return copy;
    }
}
