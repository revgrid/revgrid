import { RevGridSettings } from '../../../client/internal-api';
import { RevInMemoryBehavioredColumnSettings } from '../../../settings-implementations/internal-api';
import { RevHorizontalAlign, RevTextTruncateTypeId } from '../../../text/internal-api';
import { RevStandardBehavioredColumnSettings, RevStandardColumnSettings, RevStandardGridSettings, RevStandardOnlyColumnSettings } from '../../settings/internal-api';

/** @public */
export class RevStandardInMemoryBehavioredColumnSettings extends RevInMemoryBehavioredColumnSettings implements RevStandardBehavioredColumnSettings {
    declare gridSettings: RevStandardGridSettings;

    private _cellPadding: number | undefined;
    private _cellFocusedBorderColor: RevGridSettings.Color | undefined | null;
    private _cellHoverBackgroundColor: RevGridSettings.Color | undefined | null;
    private _columnHoverBackgroundColor: RevGridSettings.Color | undefined | null;
    private _columnHeaderFont: string | undefined | null;
    private _columnHeaderHorizontalAlign: RevHorizontalAlign | undefined | null;
    private _columnHeaderBackgroundColor: RevGridSettings.Color | undefined | null;
    private _columnHeaderForegroundColor: RevGridSettings.Color | undefined | null;
    private _columnHeaderSelectionFont: string | undefined | null;
    private _columnHeaderSelectionBackgroundColor: RevGridSettings.Color | undefined | null;
    private _columnHeaderSelectionForegroundColor: RevGridSettings.Color | undefined | null;
    private _font: string | undefined;
    private _horizontalAlign: RevHorizontalAlign | undefined;
    private _verticalOffset: number | undefined;
    private _textTruncateType: RevTextTruncateTypeId | undefined | null;
    private _textStrikeThrough: boolean | undefined;

    get cellPadding() { return this._cellPadding !== undefined ? this._cellPadding : this.gridSettings.cellPadding; }
    set cellPadding(value: number) {
        if (value !== this._cellPadding) {
            this.beginChange();
            this._cellPadding = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get cellFocusedBorderColor() {
        if (this._cellFocusedBorderColor === null) {
            return undefined;
        } else {
            return this._cellFocusedBorderColor !== undefined ? this._cellFocusedBorderColor : this.gridSettings.cellFocusedBorderColor;
        }
    }
    set cellFocusedBorderColor(value: RevGridSettings.Color | undefined) {
        if (value !== this._cellFocusedBorderColor) {
            this.beginChange();
            if (value === undefined) {
                this._cellHoverBackgroundColor = null;
            } else {
                this._cellFocusedBorderColor = value;
            }
            this.flagChangedViewRender();
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
    set cellHoverBackgroundColor(value: RevGridSettings.Color | undefined) {
        if (value !== this._cellHoverBackgroundColor) {
            this.beginChange();
            if (value === undefined) {
                this._cellHoverBackgroundColor = null;
            } else {
                this._cellHoverBackgroundColor = value;
            }
            this.flagChangedViewRender();
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
    set columnHoverBackgroundColor(value: RevGridSettings.Color | undefined) {
        if (value !== this._columnHoverBackgroundColor) {
            this.beginChange();
            if (value === undefined) {
                this._columnHoverBackgroundColor = null;
            } else {
                this._columnHoverBackgroundColor = value;
            }
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderFont() {
        if (this._columnHeaderFont === null) {
            return undefined;
        } else {
            return this._columnHeaderFont !== undefined ? this._columnHeaderFont : this.gridSettings.columnHeaderFont;
        }
    }
    set columnHeaderFont(value: string | undefined) {
        if (value !== this._columnHeaderFont) {
            this.beginChange();
            if (value === undefined) {
                this._columnHeaderFont = null;
            } else {
                this._columnHeaderFont = value;
            }
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderHorizontalAlign() {
        if (this._columnHeaderHorizontalAlign === null) {
            return undefined;
        } else {
            return this._columnHeaderHorizontalAlign !== undefined ? this._columnHeaderHorizontalAlign : this.gridSettings.columnHeaderHorizontalAlign;
        }
    }
    set columnHeaderHorizontalAlign(value: RevHorizontalAlign | undefined) {
        if (value !== this._columnHeaderHorizontalAlign) {
            this.beginChange();
            if (value === undefined) {
                this._columnHeaderHorizontalAlign = null;
            } else {
                this._columnHeaderHorizontalAlign = value;
            }
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderBackgroundColor() {
        if (this._columnHeaderBackgroundColor === null) {
            return undefined;
        } else {
            return this._columnHeaderBackgroundColor !== undefined ? this._columnHeaderBackgroundColor : this.gridSettings.columnHeaderBackgroundColor;
        }
    }
    set columnHeaderBackgroundColor(value: RevGridSettings.Color | undefined) {
        if (value !== this._columnHeaderBackgroundColor) {
            this.beginChange();
            if (value === undefined) {
                this._columnHeaderBackgroundColor = null;
            } else {
                this._columnHeaderBackgroundColor = value;
            }
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderForegroundColor() {
        if (this._columnHeaderForegroundColor === null) {
            return undefined;
        } else {
            return this._columnHeaderForegroundColor !== undefined ? this._columnHeaderForegroundColor : this.gridSettings.columnHeaderForegroundColor;
        }
    }
    set columnHeaderForegroundColor(value: RevGridSettings.Color | undefined) {
        if (value !== this._columnHeaderForegroundColor) {
            this.beginChange();
            if (value === undefined) {
                this._columnHeaderForegroundColor = null;
            } else {
                this._columnHeaderForegroundColor = value;
            }
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderSelectionFont() {
        if (this._columnHeaderSelectionFont === null) {
            return undefined;
        } else {
            return this._columnHeaderSelectionFont !== undefined ? this._columnHeaderSelectionFont : this.gridSettings.columnHeaderSelectionFont;
        }
    }
    set columnHeaderSelectionFont(value: string | undefined) {
        if (value !== this._columnHeaderSelectionFont) {
            this.beginChange();
            if (value === undefined) {
                this._columnHeaderSelectionFont = null;
            } else {
                this._columnHeaderSelectionFont = value;
            }
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderSelectionBackgroundColor() {
        if (this._columnHeaderSelectionBackgroundColor === null) {
            return undefined;
        } else {
            return this._columnHeaderSelectionBackgroundColor !== undefined ? this._columnHeaderSelectionBackgroundColor : this.gridSettings.columnHeaderSelectionBackgroundColor;
        }
    }
    set columnHeaderSelectionBackgroundColor(value: RevGridSettings.Color | undefined) {
        if (value !== this._columnHeaderSelectionBackgroundColor) {
            this.beginChange();
            if (value === undefined) {
                this._columnHeaderSelectionBackgroundColor = null;
            } else {
                this._columnHeaderSelectionBackgroundColor = value;
            }
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderSelectionForegroundColor() {
        if (this._columnHeaderSelectionForegroundColor === null) {
            return undefined;
        } else {
            return this._columnHeaderSelectionForegroundColor !== undefined ? this._columnHeaderSelectionForegroundColor : this.gridSettings.columnHeaderSelectionForegroundColor;
        }
    }
    set columnHeaderSelectionForegroundColor(value: RevGridSettings.Color | undefined) {
        if (value !== this._columnHeaderSelectionForegroundColor) {
            this.beginChange();
            if (value === undefined) {
                this._columnHeaderSelectionForegroundColor = null;
            } else {
                this._columnHeaderSelectionForegroundColor = value;
            }
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get font() { return this._font !== undefined ? this._font : this.gridSettings.font; }
    set font(value: string) {
        if (value !== this._font) {
            this.beginChange();
            this._font = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get horizontalAlign() { return this._horizontalAlign !== undefined ? this._horizontalAlign : this.gridSettings.horizontalAlign; }
    set horizontalAlign(value: RevHorizontalAlign) {
        if (value !== this._horizontalAlign) {
            this.beginChange();
            this._horizontalAlign = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get verticalOffset() { return this._verticalOffset !== undefined ? this._verticalOffset : this.gridSettings.verticalOffset; }
    set verticalOffset(value: number) {
        if (value !== this._verticalOffset) {
            this.beginChange();
            this._verticalOffset = value;
            this.flagChangedViewRender();
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
    set textTruncateType(value: RevTextTruncateTypeId | undefined) {
        if (value !== this._textTruncateType) {
            this.beginChange();
            if (value === undefined) {
                this._textTruncateType = null;
            } else {
                this._textTruncateType = value;
            }
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get textStrikeThrough() { return this._textStrikeThrough !== undefined ? this._textStrikeThrough : this.gridSettings.textStrikeThrough; }
    set textStrikeThrough(value: boolean) {
        if (value !== this._textStrikeThrough) {
            this.beginChange();
            this._textStrikeThrough = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }

    override merge(settings: Partial<RevStandardColumnSettings>) {
        this.beginChange();

        super.merge(settings);

        const requiredSettings = settings as Required<RevStandardColumnSettings>; // since we only iterate over keys that exist we can assume that settings is not partial in the switch loop
        for (const key in settings) {
            // Use loop so that compiler will report error if any setting missing
            const columnSettingsKey = key as keyof RevStandardOnlyColumnSettings;
            switch (columnSettingsKey) {
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

                default:
                    columnSettingsKey satisfies never;
            }
        }

        return this.endChange();
    }

    override clone() {
        const copy = new RevStandardInMemoryBehavioredColumnSettings(this.gridSettings);
        copy.merge(this);
        return copy;
    }
}
