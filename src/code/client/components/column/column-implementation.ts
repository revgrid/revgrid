// import { Column } from '../../interfaces/data/column';
import { RevDataServer, RevSchemaField } from '../../../common/internal-api';
import { RevColumn } from '../../interfaces/dataless/column';
import { RevBehavioredColumnSettings } from '../../settings/internal-api';

/** @internal */
export class RevColumnImplementation<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevColumn<BCS, SF> {
    preferredWidth: number | undefined;

    private _width: number;
    private _autoSizing: boolean;

    constructor(
        readonly field: SF,
        readonly settings: BCS,
        private readonly _widthChangedEventer: RevColumnImplementation.WidthChangedEventer<BCS, SF>,
        private readonly _horizontalViewLayoutInvalidatedEventer: RevColumnImplementation.HorizontalViewLayoutInvalidatedEventer,
    ) {
        this._width = this.settings.defaultColumnWidth;
        this._autoSizing = this.settings.defaultColumnAutoSizing;
    }

    get width() { return this._width; }
    set width(value: number) {
        this.setWidthAndPossiblyNotify(value, true, true);
    }
    get autoSizing() { return this._autoSizing; }
    set autoSizing(value: boolean) {
        this.setAutoWidthSizing(value);
    }

    setWidth(width: number, ui: boolean) {
        return this.setWidthAndPossiblyNotify(width, ui, true);
    }

    setWidthAndPossiblyNotify(width: number, ui: boolean, notifyWidthChange: boolean) {
        let changed: boolean;

        width = Math.ceil(Math.min(Math.max(this.settings.minimumColumnWidth, width), this.settings.maximumColumnWidth ?? Infinity));
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

    setAutoWidthSizing(value: boolean) {
        let changed: boolean;

        if (value === this._autoSizing) {
            changed = false;
        } else {
            if (value) {
                this._width = 5; // set very low so that autowidening will autosize
            }
            this._autoSizing = value;
            changed = true;
        }

        if (changed) {
            this._horizontalViewLayoutInvalidatedEventer();
        }

        return changed;
    }

    checkAutoWidthSizing(widenOnly: boolean) {
        const autosized = this.checkAutoWidthSizingWithoutInvalidation(widenOnly);
        if (autosized) {
            this._horizontalViewLayoutInvalidatedEventer();
        }
        return autosized;
    }

    autoSizeWidth(widenOnly: boolean) {
        const autosized = this.autoSizeWidthWithoutInvalidation(widenOnly);
        if (autosized) {
            this._horizontalViewLayoutInvalidatedEventer();
        }
        return autosized;
    }

    /**
     * Amend properties for this hypergrid only.
     * @param settings - A simple properties hash.
     */
    loadSettings(settings: BCS) {
        this.settings.merge(settings);
    }

    /**
     * @returns '' if data value is undefined
     */
    getValueFromDataRow(dataRow: RevDataServer.ViewRow): RevDataServer.ViewValue {
        if (Array.isArray(dataRow)) {
            return dataRow[this.field.index];
        } else {
            return dataRow[this.field.name];
        }
    }

    /** @internal */
    checkAutoWidthSizingWithoutInvalidation(widenOnly: boolean) {
        if (this._autoSizing) {
            return this.autoSizeWidthWithoutInvalidation(widenOnly);
        } else {
            return false;
        }
    }

    /** @internal */
    autoSizeWidthWithoutInvalidation(widenOnly: boolean) {
        const settings = this.settings;

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
}

export namespace RevColumnImplementation {
    export type WidthChangedEventer<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = (this: void, column: RevColumnImplementation<BCS, SF>, ui: boolean) => void;
    export type HorizontalViewLayoutInvalidatedEventer = (this: void) => void;
}
