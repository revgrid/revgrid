import {
    GridSettingChangeInvalidateTypeId,
    GridSettings,
} from '../../../grid/grid-public-api';
import { HorizontalAlign, InMemoryTextBehavioredGridSettings } from '../../../text/text-public-api';
import { StandardBehavioredGridSettings, StandardGridSettings, StandardOnlyGridSettings } from '../../settings/standard-settings-public-api';

/** @public */
export class InMemoryStandardBehavioredGridSettings extends InMemoryTextBehavioredGridSettings implements StandardBehavioredGridSettings {
    private _cellPadding: number;
    private _cellFocusedBorderColor: GridSettings.Color | undefined;
    private _cellHoverBackgroundColor: GridSettings.Color | undefined;
    private _columnHoverBackgroundColor: GridSettings.Color | undefined;
    private _columnHeaderFont: string;
    private _columnHeaderHorizontalAlign: HorizontalAlign;
    private _columnHeaderBackgroundColor: GridSettings.Color;
    private _columnHeaderForegroundColor: GridSettings.Color;
    private _columnHeaderSelectionFont: string;
    private _columnHeaderSelectionBackgroundColor: GridSettings.Color;
    private _columnHeaderSelectionForegroundColor: GridSettings.Color;
    private _rowHoverBackgroundColor: GridSettings.Color | undefined;
    private _selectionFont: GridSettings.Color;
    private _selectionBackgroundColor: GridSettings.Color;
    private _selectionForegroundColor: GridSettings.Color;
    private _font: string;
    private _editorClickCursorName: string | undefined;

    get cellPadding() { return this._cellPadding; }
    set cellPadding(value: number) {
        if (value !== this._cellPadding) {
            this.beginChange();
            this._cellPadding = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get cellFocusedBorderColor() { return this._cellFocusedBorderColor; }
    set cellFocusedBorderColor(value: GridSettings.Color | undefined) {
        if (value !== this._cellFocusedBorderColor) {
            this.beginChange();
            this._cellFocusedBorderColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get cellHoverBackgroundColor() { return this._cellHoverBackgroundColor; }
    set cellHoverBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._cellHoverBackgroundColor) {
            this.beginChange();
            this._cellHoverBackgroundColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get columnHoverBackgroundColor() { return this._columnHoverBackgroundColor; }
    set columnHoverBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._columnHoverBackgroundColor) {
            this.beginChange();
            this._columnHoverBackgroundColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderFont() { return this._columnHeaderFont; }
    set columnHeaderFont(value: string) {
        if (value !== this._columnHeaderFont) {
            this.beginChange();
            this._columnHeaderFont = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderHorizontalAlign() { return this._columnHeaderHorizontalAlign; }
    set columnHeaderHorizontalAlign(value: HorizontalAlign) {
        if (value !== this._columnHeaderHorizontalAlign) {
            this.beginChange();
            this._columnHeaderHorizontalAlign = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderBackgroundColor() { return this._columnHeaderBackgroundColor; }
    set columnHeaderBackgroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderBackgroundColor) {
            this.beginChange();
            this._columnHeaderBackgroundColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderForegroundColor() { return this._columnHeaderForegroundColor; }
    set columnHeaderForegroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderForegroundColor) {
            this.beginChange();
            this._columnHeaderForegroundColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderSelectionFont() { return this._columnHeaderSelectionFont; }
    set columnHeaderSelectionFont(value: string) {
        if (value !== this._columnHeaderSelectionFont) {
            this.beginChange();
            this._columnHeaderSelectionFont = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderSelectionBackgroundColor() { return this._columnHeaderSelectionBackgroundColor; }
    set columnHeaderSelectionBackgroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderSelectionBackgroundColor) {
            this.beginChange();
            this._columnHeaderSelectionBackgroundColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get columnHeaderSelectionForegroundColor() { return this._columnHeaderSelectionForegroundColor; }
    set columnHeaderSelectionForegroundColor(value: GridSettings.Color) {
        if (value !== this._columnHeaderSelectionForegroundColor) {
            this.beginChange();
            this._columnHeaderSelectionForegroundColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get rowHoverBackgroundColor() { return this._rowHoverBackgroundColor; }
    set rowHoverBackgroundColor(value: GridSettings.Color | undefined) {
        if (value !== this._rowHoverBackgroundColor) {
            this.beginChange();
            this._rowHoverBackgroundColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get selectionFont() { return this._selectionFont; }
    set selectionFont(value: GridSettings.Color) {
        if (value !== this._selectionFont) {
            this.beginChange();
            this._selectionFont = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get selectionBackgroundColor() { return this._selectionBackgroundColor; }
    set selectionBackgroundColor(value: GridSettings.Color) {
        if (value !== this._selectionBackgroundColor) {
            this.beginChange();
            this._selectionBackgroundColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get selectionForegroundColor() { return this._selectionForegroundColor; }
    set selectionForegroundColor(value: GridSettings.Color) {
        if (value !== this._selectionForegroundColor) {
            this.beginChange();
            this._selectionForegroundColor = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get font() { return this._font; }
    set font(value: string) {
        if (value !== this._font) {
            this.beginChange();
            this._font = value;
            this.notifyChangedViewRender();
            this.endChange();
        }
    }
    get editorClickCursorName() { return this._editorClickCursorName; }
    set editorClickCursorName(value: string | undefined) {
        if (value !== this._editorClickCursorName) {
            this.beginChange();
            this._editorClickCursorName = value;
            this.notifyChanged(GridSettingChangeInvalidateTypeId.None);
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
                    this._cellPadding = requiredSettings.cellPadding;
                    break;
                case 'cellFocusedBorderColor':
                    this._cellFocusedBorderColor = requiredSettings.cellFocusedBorderColor;
                    break;
                case 'cellHoverBackgroundColor':
                    this._cellHoverBackgroundColor = requiredSettings.cellHoverBackgroundColor;
                    break;
                case 'columnHoverBackgroundColor':
                    this._columnHoverBackgroundColor = requiredSettings.columnHoverBackgroundColor;
                    break;
                case 'columnHeaderFont':
                    this._columnHeaderFont = requiredSettings.columnHeaderFont;
                    break;
                case 'columnHeaderHorizontalAlign':
                    this._columnHeaderHorizontalAlign = requiredSettings.columnHeaderHorizontalAlign;
                    break;
                case 'columnHeaderBackgroundColor':
                    this._columnHeaderBackgroundColor = requiredSettings.columnHeaderBackgroundColor;
                    break;
                case 'columnHeaderForegroundColor':
                    this._columnHeaderForegroundColor = requiredSettings.columnHeaderForegroundColor;
                    break;
                case 'columnHeaderSelectionFont':
                    this._columnHeaderSelectionFont = requiredSettings.columnHeaderSelectionFont;
                    break;
                case 'columnHeaderSelectionBackgroundColor':
                    this._columnHeaderSelectionBackgroundColor = requiredSettings.columnHeaderSelectionBackgroundColor;
                    break;
                case 'columnHeaderSelectionForegroundColor':
                    this._columnHeaderSelectionForegroundColor = requiredSettings.columnHeaderSelectionForegroundColor;
                    break;
                case 'rowHoverBackgroundColor':
                    this._rowHoverBackgroundColor = requiredSettings.rowHoverBackgroundColor;
                    break;
                case 'selectionFont':
                    this._selectionFont = requiredSettings.selectionFont;
                    break;
                case 'selectionBackgroundColor':
                    this._selectionBackgroundColor = requiredSettings.selectionBackgroundColor;
                    break;
                case 'selectionForegroundColor':
                    this._selectionForegroundColor = requiredSettings.selectionForegroundColor;
                    break;
                case 'font':
                    this._font = requiredSettings.font;
                    break;
                case 'editorClickCursorName':
                    this._editorClickCursorName = requiredSettings.editorClickCursorName;
                    break;

                default: {
                    gridSettingsKey satisfies never;
                }
            }
        }

        this.endChange();
    }

    override clone() {
        const copy = new InMemoryStandardBehavioredGridSettings();
        copy.merge(this);
        return copy;
    }
}
