// import { Column } from '../../interfaces/data/column';
import { DataServer } from '../../interfaces/data/data-server';
import { Column } from '../../interfaces/schema/column';
import { SchemaServer } from '../../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { ColumnSettings } from '../../interfaces/settings/column-settings';

/** @internal */
export class ColumnImplementation<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> implements Column<BCS, SF> {
    readonly field: SF;

    /** @internal */
    preferredWidth: number | undefined;

    /** @internal */
    private _width: number;
    /** @internal */
    private _autosizing: boolean;
    /** @internal */
    private _settings: BCS;

    /** @summary Create a new `Column` object.
     * @param columnSchema.header - Displayed in column headers. If not defined, name is used.
     * @param columnSchema.calculator - Define to make a computed column.
     * @param columnSchema.type - For possible data model use. (Not used in core.)
     */
    /** @internal */
    constructor(
        field: SF,
        columnSettings: BCS,
        private readonly _horizontalViewLayoutInvalidatedEventer: ColumnImplementation.HorizontalViewLayoutInvalidatedEventer,
    ) {
        this.field = field;
        this._settings = columnSettings;
        this._width = this._settings.defaultColumnWidth;
        this._autosizing = this._settings.defaultColumnAutosizing;
    }

    // mixIn: overrider.mixIn,

    /**
     * @summary Get or set the text of the column's header.
     * @desc The _header_ is the label at the top of the column.
     *
     * Setting the header updates both:
     * * the `schema` (aka, header) array in the underlying data source; and
     * * the filter.
     * @type {string}
     */
    // set header(header: string) {
    //     this.schemaColumn.header = header;
    // }
    // get header() {
    //     return this.schemaColumn.header;
    // }

    /**
     * @summary Get or set the computed column's calculator function.
     * @desc Setting the value here updates the calculator in the data model schema.
     *
     * The results of the new calculations will appear in the column cells on the next repaint.
     * @type {string}
     */
    // set calculator(calculator: SchemaServer.Column.Calculator) {
    //     calculator = this.resolveCalculator(calculator);
    //     if (calculator !== this.schemaColumn.calculator) {
    //         this.schemaColumn.calculator = calculator;
    //         this.grid.reindex();
    //     }
    // }
    // get calculator() {
    //     return this.schemaColumn.calculator;
    // }

    get settings() { return this._settings; }
    get width() { return this._width; }
    get autosizing() { return this._autosizing; }

    setWidth(width: number | undefined) {
        let changed: boolean;

        if (width === undefined) {
            if (this._autosizing) {
                changed = false;
            } else {
                this._autosizing = true;
                changed = true;
            }
        } else {
            width = Math.ceil(Math.min(Math.max(this._settings.minimumColumnWidth, width), this._settings.maximumColumnWidth ?? Infinity));
            if (!this._autosizing && width === this._width) {
                changed = false;
            } else {
                this._width = width;
                this._autosizing = false;
                changed = true;
            }
        }

        if (changed) {
            this._horizontalViewLayoutInvalidatedEventer();
        }

        return changed;
    }

    getPreferredWidth() {
        return this.preferredWidth;
    }

    /** @internal */
    checkColumnAutosizing(widenOnly: boolean) {
        if (!this._autosizing) {
            return false;
        } else {
            const settings = this._settings;

            let newWidth: number;
            if (!settings.defaultColumnAutosizing) {
                newWidth = settings.defaultColumnWidth;
            } else {
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

                    const columnAutosizingMax = settings.columnAutosizingMax;
                    if (columnAutosizingMax !== undefined) {
                        if (newWidth > columnAutosizingMax) {
                            newWidth = columnAutosizingMax;
                        }
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

    // set properties(properties) {
    //     this.addProperties(properties, true);
    // }

    /**
     * @desc Amend properties for this hypergrid only.
     * @param settings - A simple properties hash.
     */
    loadSettings(settings: ColumnSettings) {
        this._settings.load(settings);
    }

    /**
     * @returns '' if data value is undefined
     * @internal
     */
    getValueFromDataRow(dataRow: DataServer.ViewRow): DataServer.ViewValue {
        if (Array.isArray(dataRow)) {
            return dataRow[this.field.index];
        } else {
            return dataRow[this.field.name];
        }
    }


    /**
     * Copy a properties collection to this column's properties object.
     *
     * When a value is `undefined` or `null`, the property is deleted except when a setter or non-configurable in which case it's set to `undefined`.
     * @param properties - Properties to copy to column's properties object. If `undefined`, this call is a no-op.
     * @param settingState - Clear column's properties object before copying properties.
     */
    /** This method is provided because some grid renderer optimizations require that the grid renderer be informed when column colors change. Due to performance concerns, they cannot take the time to figure it out for themselves. Along the same lines, making the property a getter/setter (in columnProperties.js), though doable, might present performance concerns as this property is possibly the most accessed of all column properties.
     * @param color
     */
    /** @internal */
    // setBackgroundColor(color: string) {
    //     if (this.properties.backgroundColor !== color) {
    //         this.properties.backgroundColor = color;
    //         this.grid.renderer.rebundleGridRenderers();
    //     }
    // }

    /**
     * @summary Get a new cell editor.
     * @desc The cell editor to use must be registered with the key in the cell's `editor` property.
     *
     * The cell's `format` property is mixed into the provided cellEvent for possible overriding by developer's override of {@link DataServer.prototype.getCellEditorAt} before being used by {@link CellEditor} to parse and format the cell value.
     *
     * @returns Falsy value means either no declared cell editor _or_ instantiation aborted by falsy return from `fireRequestCellEdit`.
     */
    /** @internal */
    // getCellEditorAt(cellEvent: CellEvent) {
    //     const columnIndex = this.index;
    //     const rowIndex = cellEvent.gridCell.y;
    //     const editorName = cellEvent.columnProperties.editor;

    //     // I do not think this is needed
    //     // const options = Object.create(cellEvent, {
    //     //         format: {
    //     //             // `options.format` is a copy of the cell's `format` property which is:
    //     //             // 1. Subject to adjustment by the `getCellEditorAt` override.
    //     //             // 2. Then used by the cell editor to reference the registered localizer (defaults to 'string' localizer)
    //     //             writable: true,
    //     //             enumerable: true, // so cell editor will copy it to self
    //     //             value: cellEvent.columnProperties.format
    //     //         }
    //     //     });

    //     if (editorName === undefined) {
    //         return undefined;
    //     } else {
    //         const cellEditor = cellEvent.subgrid.getCellEditorAt(columnIndex, rowIndex, editorName, cellEvent);

    //         if (cellEditor && !cellEditor.grid) {
    //             // cell editor returned but not fully instantiated (aborted by falsy return from fireRequestCellEdit)
    //             return undefined;
    //         } else {
    //             return cellEditor;
    //         }
    //     }
    // }

    /** @internal */
    // getFormatter() {
    //     const localizerName = this.properties.format;
    //     return this.grid.localization.get(localizerName).format;
    // }
}

export namespace ColumnImplementation {
    export type HorizontalViewLayoutInvalidatedEventer = (this: void) => void;
}
