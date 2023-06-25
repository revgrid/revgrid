import {
    GridSettingChangeInvalidateTypeId,
    GridSettings,
} from '../../../grid/grid-public-api';
import { HorizontalAlign, InMemoryTextBehavioredColumnSettings } from '../../../text/text-public-api';
import { StandardBehavioredColumnSettings, StandardColumnSettings, StandardGridSettings, StandardOnlyColumnSettings } from '../../settings/standard-settings-public-api';

/** @public */
export class InMemoryStandardBehavioredColumnSettings extends InMemoryTextBehavioredColumnSettings implements StandardBehavioredColumnSettings {
    declare gridSettings: StandardGridSettings;

    private _cellPadding: number | undefined;
    private _cellFocusedBorderColor: GridSettings.Color | undefined | null;
    private _cellHoverBackgroundColor: GridSettings.Color | undefined | null;
    private _columnHoverBackgroundColor: GridSettings.Color | undefined | null;
    private _columnHeaderFont: string | undefined;
    private _columnHeaderHorizontalAlign: HorizontalAlign | undefined;
    private _columnHeaderBackgroundColor: GridSettings.Color | undefined;
    private _columnHeaderForegroundColor: GridSettings.Color | undefined;
    private _columnHeaderSelectionFont: string | undefined;
    private _columnHeaderSelectionBackgroundColor: GridSettings.Color | undefined;
    private _columnHeaderSelectionForegroundColor: GridSettings.Color | undefined;
    private _font: string | undefined;
    private _horizontalAlign: HorizontalAlign | undefined;
    private _editorClickCursorName: string | undefined | null;

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
    set cellFocusedBorderColor(value: GridSettings.Color | undefined) {
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
    set cellHoverBackgroundColor(value: GridSettings.Color | undefined) {
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
    set columnHoverBackgroundColor(value: GridSettings.Color | undefined) {
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
    get columnHeaderFont() { return this._columnHeaderFont !== undefined ? this._columnHeaderFont : this.gridSettings.columnHeaderFont; }
    set columnHeaderFont(value: string) {
        if (value !== this._columnHeaderFont) {
            this.beginChange();
            this._columnHeaderFont = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderHorizontalAlign() {
        return this._columnHeaderHorizontalAlign !== undefined ? this._columnHeaderHorizontalAlign : this.gridSettings.columnHeaderHorizontalAlign;
    }
    set columnHeaderHorizontalAlign(value: HorizontalAlign) {
        if (value !== this._columnHeaderHorizontalAlign) {
            this.beginChange();
            this._columnHeaderHorizontalAlign = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderBackgroundColor() { return this._columnHeaderBackgroundColor !== undefined ? this._columnHeaderBackgroundColor : this.gridSettings.columnHeaderBackgroundColor; }
    set columnHeaderBackgroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderBackgroundColor) {
            this.beginChange();
            this._columnHeaderBackgroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderForegroundColor() { return this._columnHeaderForegroundColor !== undefined ? this._columnHeaderForegroundColor : this.gridSettings.columnHeaderForegroundColor; }
    set columnHeaderForegroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderForegroundColor) {
            this.beginChange();
            this._columnHeaderForegroundColor = value;
            this.flagChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderSelectionFont() { return this._columnHeaderSelectionFont !== undefined ? this._columnHeaderSelectionFont : this.gridSettings.columnHeaderSelectionFont; }
    set columnHeaderSelectionFont(value: string) {
        if (value !== this._columnHeaderSelectionFont) {
            this.beginChange();
            this._columnHeaderSelectionFont = value;
            this.flagChangedViewRender();
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
            this.flagChangedViewRender();
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
    set horizontalAlign(value: HorizontalAlign) {
        if (value !== this._horizontalAlign) {
            this.beginChange();
            this._horizontalAlign = value;
            this.flagChangedViewRender();
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
            this.flagChanged(GridSettingChangeInvalidateTypeId.None);
            this.endChange();
        }
    }

    override merge(settings: Partial<StandardColumnSettings>) {
        this.beginChange();

        super.merge(settings);

        const requiredSettings = settings as Required<StandardColumnSettings>; // since we only iterate over keys that exist we can assume that settings is not partial in the switch loop
        for (const key in settings) {
            // Use loop so that compiler will report error if any setting missing
            const columnSettingsKey = key as keyof StandardOnlyColumnSettings;
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
                case 'editorClickCursorName':
                    if (this._editorClickCursorName !== requiredSettings.editorClickCursorName) {
                        this._editorClickCursorName = requiredSettings.editorClickCursorName;
                        this.flagChanged(GridSettingChangeInvalidateTypeId.None);
                    }
                    break;

                default:
                    columnSettingsKey satisfies never;
            }
        }

        return this.endChange();
    }

    override clone() {
        const copy = new InMemoryStandardBehavioredColumnSettings(this.gridSettings);
        copy.merge(this);
        return copy;
    }
}
