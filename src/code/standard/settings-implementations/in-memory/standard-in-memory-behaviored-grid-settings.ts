import { RevHorizontalAlign, RevHorizontalAlignId, RevTextTruncateType, RevTextTruncateTypeId } from '../../../cell-content/client/internal-api';
import { RevGridSettings } from '../../../client/internal-api';
import { RevInMemoryBehavioredGridSettings } from '../../../settings-implementations/internal-api';
import { RevStandardBehavioredGridSettings, RevStandardGridSettings, RevStandardOnlyGridSettings } from '../../settings/internal-api';

/** @public */
export class RevStandardInMemoryBehavioredGridSettings extends RevInMemoryBehavioredGridSettings implements RevStandardBehavioredGridSettings {
    private _cellPadding: number;
    private _cellFocusedBorderColor: RevGridSettings.Color | undefined;
    private _cellHoverBackgroundColor: RevGridSettings.Color | undefined;
    private _columnHoverBackgroundColor: RevGridSettings.Color | undefined;
    private _columnHeaderFont: string | undefined;
    private _columnHeaderHorizontalAlignId: RevHorizontalAlignId | undefined;
    private _columnHeaderHorizontalAlign: RevHorizontalAlign | undefined;
    private _columnHeaderBackgroundColor: RevGridSettings.Color | undefined;
    private _columnHeaderForegroundColor: RevGridSettings.Color | undefined;
    private _columnHeaderSelectionFont: string | undefined;
    private _columnHeaderSelectionBackgroundColor: RevGridSettings.Color | undefined;
    private _columnHeaderSelectionForegroundColor: RevGridSettings.Color | undefined;
    private _rowHoverBackgroundColor: RevGridSettings.Color | undefined;
    private _selectionFont: RevGridSettings.Color | undefined;
    private _selectionBackgroundColor: RevGridSettings.Color | undefined;
    private _selectionForegroundColor: RevGridSettings.Color | undefined;
    private _font: string;
    private _horizontalAlignId: RevHorizontalAlignId;
    private _horizontalAlign: RevHorizontalAlign;
    private _verticalOffset: number;
    private _textTruncateTypeId: RevTextTruncateTypeId | undefined;
    private _textTruncateType: RevTextTruncateType | undefined;
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
    set cellFocusedBorderColor(value: RevGridSettings.Color | undefined) {
        if (value !== this._cellFocusedBorderColor) {
            this.beginChange();
            this._cellFocusedBorderColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get cellHoverBackgroundColor() { return this._cellHoverBackgroundColor; }
    set cellHoverBackgroundColor(value: RevGridSettings.Color | undefined) {
        if (value !== this._cellHoverBackgroundColor) {
            this.beginChange();
            this._cellHoverBackgroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHoverBackgroundColor() { return this._columnHoverBackgroundColor; }
    set columnHoverBackgroundColor(value: RevGridSettings.Color | undefined) {
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
    get columnHeaderHorizontalAlignId() { return this._columnHeaderHorizontalAlignId; }
    get columnHeaderHorizontalAlign() { return this._columnHeaderHorizontalAlign; }
    set columnHeaderHorizontalAlign(value: RevHorizontalAlign | undefined) {
        if (value !== this._columnHeaderHorizontalAlign) {
            this.beginChange();
            this._columnHeaderHorizontalAlign = value;
            if (value === undefined) {
                this._columnHeaderHorizontalAlignId = undefined;
            } else {
                this._columnHeaderHorizontalAlignId = RevHorizontalAlign.toId(value);
            }
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderBackgroundColor() { return this._columnHeaderBackgroundColor; }
    set columnHeaderBackgroundColor(value: RevGridSettings.Color | undefined) {
        if (value !== this._columnHeaderBackgroundColor) {
            this.beginChange();
            this._columnHeaderBackgroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderForegroundColor() { return this._columnHeaderForegroundColor; }
    set columnHeaderForegroundColor(value: RevGridSettings.Color | undefined) {
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
    set columnHeaderSelectionBackgroundColor(value: RevGridSettings.Color | undefined) {
        if (value !== this._columnHeaderSelectionBackgroundColor) {
            this.beginChange();
            this._columnHeaderSelectionBackgroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderSelectionForegroundColor() { return this._columnHeaderSelectionForegroundColor; }
    set columnHeaderSelectionForegroundColor(value: RevGridSettings.Color | undefined) {
        if (value !== this._columnHeaderSelectionForegroundColor) {
            this.beginChange();
            this._columnHeaderSelectionForegroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get rowHoverBackgroundColor() { return this._rowHoverBackgroundColor; }
    set rowHoverBackgroundColor(value: RevGridSettings.Color | undefined) {
        if (value !== this._rowHoverBackgroundColor) {
            this.beginChange();
            this._rowHoverBackgroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get selectionFont() { return this._selectionFont; }
    set selectionFont(value: RevGridSettings.Color | undefined) {
        if (value !== this._selectionFont) {
            this.beginChange();
            this._selectionFont = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get selectionBackgroundColor() { return this._selectionBackgroundColor; }
    set selectionBackgroundColor(value: RevGridSettings.Color | undefined) {
        if (value !== this._selectionBackgroundColor) {
            this.beginChange();
            this._selectionBackgroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get selectionForegroundColor() { return this._selectionForegroundColor; }
    set selectionForegroundColor(value: RevGridSettings.Color | undefined) {
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
    get horizontalAlignId() { return this._horizontalAlignId; }
    get horizontalAlign() { return this._horizontalAlign; }
    set horizontalAlign(value: RevHorizontalAlign) {
        if (value !== this._horizontalAlign) {
            this.beginChange();
            this._horizontalAlign = value;
            this._horizontalAlignId = RevHorizontalAlign.toId(value);
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
    get textTruncateTypeId() { return this._textTruncateTypeId; }
    get textTruncateType() { return this._textTruncateType; }
    set textTruncateType(value: RevTextTruncateType | undefined) {
        if (value !== this._textTruncateType) {
            this.beginChange();
            this._textTruncateType = value;
            this._textTruncateTypeId = value === undefined ? undefined : RevTextTruncateType.toId(value);
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

    override merge(settings: Partial<RevStandardGridSettings>) {
        this.beginChange();

        super.merge(settings);

        const requiredSettings = settings as Required<RevStandardGridSettings>; // since we only iterate over keys that exist we can assume that settings is not partial in the switch loop
        for (const key in settings) {
            // Use loop so that compiler will report error if any setting missing
            const gridSettingsKey = key as keyof RevStandardOnlyGridSettings;
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
                case 'columnHeaderHorizontalAlignId':
                    break; // Always same as columnHeaderHorizontalAlign
                case 'columnHeaderHorizontalAlign':
                    if (this._columnHeaderHorizontalAlign !== requiredSettings.columnHeaderHorizontalAlign) {
                        this._columnHeaderHorizontalAlignId = requiredSettings.columnHeaderHorizontalAlignId;
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
                case 'horizontalAlignId':
                    break; // Always same as columnHeaderHorizontalAlign
                case 'horizontalAlign':
                    if (this._horizontalAlign !== requiredSettings.horizontalAlign) {
                        this._horizontalAlignId = requiredSettings.horizontalAlignId;
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
                case 'textTruncateTypeId':
                    break; // Always same as columnHeaderHorizontalAlign
                case 'textTruncateType':
                    if (this._textTruncateType !== requiredSettings.textTruncateTypeId) {
                        this._textTruncateTypeId = requiredSettings.textTruncateTypeId;
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
        const copy = new RevStandardInMemoryBehavioredGridSettings();
        copy.merge(this);
        return copy;
    }
}
