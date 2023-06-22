// import { Column } from '../../interfaces/data/column';
import { DataServer } from '../../interfaces/data/data-server';
import { Column } from '../../interfaces/dataless/column';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';

/** @internal */
export class ColumnImplementation<BCS extends BehavioredColumnSettings, SF extends SchemaField> implements Column<BCS, SF> {
    readonly field: SF;

    preferredWidth: number | undefined;

    private _width: number;
    private _autoSizing: boolean;
    private _settings: BCS;

    constructor(
        field: SF,
        columnSettings: BCS,
        private readonly _widthChangedEventer: ColumnImplementation.WidthChangedEventer<BCS, SF>,
        private readonly _horizontalViewLayoutInvalidatedEventer: ColumnImplementation.HorizontalViewLayoutInvalidatedEventer,
    ) {
        this.field = field;
        this._settings = columnSettings;
        this._width = this._settings.defaultColumnWidth;
        this._autoSizing = this._settings.defaultColumnAutoSizing;
    }

    get settings() { return this._settings; }
    get width() { return this._width; }
    set width(value: number) {
        this.setWidthAndPossiblyNotify(value, true, true);
    }
    get autoSizing() { return this._autoSizing; }
    set autoSizing(value: boolean) {
        this.setAutoSizing(value);
    }

    setWidth(width: number, ui: boolean) {
        return this.setWidthAndPossiblyNotify(width, ui, true);
    }

    setWidthAndPossiblyNotify(width: number, ui: boolean, notifyWidthChange: boolean) {
        let changed: boolean;

        width = Math.ceil(Math.min(Math.max(this._settings.minimumColumnWidth, width), this._settings.maximumColumnWidth ?? Infinity));
        if (!this._autoSizing && width === this._width) {
            changed = false;
        } else {
            this._width = width;
            this._autoSizing = false;
            changed = true;
        }

        if (changed) {
            if (notifyWidthChange) {
                this._widthChangedEventer(this, ui);
            } else {
                this._horizontalViewLayoutInvalidatedEventer();
            }
        }

        return changed;
    }

    setAutoSizing(value: boolean) {
        let changed: boolean;

        if (value === this._autoSizing) {
            changed = false;
        } else {
            this._autoSizing = value;
            changed = true;
        }

        if (changed) {
            this._horizontalViewLayoutInvalidatedEventer();
        }

        return changed;
    }

    checkAutoSizing(widenOnly: boolean) {
        if (this._autoSizing) {
            return this.autoSize(widenOnly);
        } else {
            return false;
        }
    }

    autoSize(widenOnly: boolean) {
        const settings = this._settings;

        let newWidth: number;
        const preferredWidth = this.preferredWidth;
        if (preferredWidth === undefined) {
            return false;
        } else {
            if (widenOnly) {
                const oldWidth = this._width;
                if (oldWidth >= preferredWidth) {
                    return false;
                } else {
                    newWidth = preferredWidth;
                }
            } else {
                newWidth = preferredWidth;
            }

            const autoSizingMax = settings.columnAutoSizingMax;
            if (autoSizingMax !== undefined) {
                if (newWidth > autoSizingMax) {
                    newWidth = autoSizingMax;
                }
            }
        }

        if (newWidth === this._width) {
            return false;
        } else {
            this._width = newWidth;
            return true;
        }
    }

    /**
     * @desc Amend properties for this hypergrid only.
     * @param settings - A simple properties hash.
     */
    loadSettings(settings: Partial<BCS>) {
        this._settings.merge(settings);
    }

    /**
     * @returns '' if data value is undefined
     */
    getValueFromDataRow(dataRow: DataServer.ViewRow): DataServer.ViewValue {
        if (Array.isArray(dataRow)) {
            return dataRow[this.field.index];
        } else {
            return dataRow[this.field.name];
        }
    }
}

export namespace ColumnImplementation {
    export type WidthChangedEventer<BCS extends BehavioredColumnSettings, SF extends SchemaField> = (this: void, column: ColumnImplementation<BCS, SF>, ui: boolean) => void;
    export type HorizontalViewLayoutInvalidatedEventer = (this: void) => void;
}
