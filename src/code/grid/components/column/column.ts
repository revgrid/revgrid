import { ColumnInterface } from '../../interfaces/column-interface';
import { ColumnSettings, MergableColumnSettings } from '../../interfaces/column-settings';
import { DataModel } from '../../interfaces/data-model';
import { GridSettings } from '../../interfaces/grid-settings';
import { SchemaModel } from '../../interfaces/schema-model';
import { ColumnSettingsAccessor } from '../../settings-accessors/column-settings-accessor';

/** @public */
export class Column implements ColumnInterface {
    readonly schemaColumn: SchemaModel.Column;
    readonly index: number; // always the same as SchemaColumn index
    readonly name: string;

    /** @internal */
    private _settings: MergableColumnSettings;

    /** @summary Create a new `Column` object.
     * @param columnSchema.header - Displayed in column headers. If not defined, name is used.
     * @param columnSchema.calculator - Define to make a computed column.
     * @param columnSchema.type - For possible data model use. (Not used in core.)
     */
    /** @internal */
    constructor(
        private readonly _gridSettings: GridSettings,
        schemaColumn: SchemaModel.Column
    ) {
        this.index = schemaColumn.index;
        this.name = schemaColumn.name

        // this.properties = columnSchema; // see {@link Column#properties properties} setter
        this._settings = new ColumnSettingsAccessor(this._gridSettings, schemaColumn.initialSettings); // see {@link Column#properties properties} setter
        this.schemaColumn = schemaColumn;
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
    // set calculator(calculator: SchemaModel.Column.Calculator) {
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

    getWidth() {
        return this._settings.width;
    }

    setWidth(width: number | undefined) {
        if (width === undefined) {
            if (this._settings.columnAutosizing) {
                return false;
            } else {
                this._settings.columnAutosizing = true;
                return true;
            }
        } else {
            width = Math.min(Math.max(this._settings.minimumColumnWidth, width), this._settings.maximumColumnWidth || Infinity);
            if (!this._settings.columnAutosizing && width === this._settings.width) {
                return false;
            } else {
                this._settings.width = Math.ceil(width);
                this._settings.columnAutosizing = false;
                return true;
            }
        }
    }

    setWidthToAutoSizing() {
        if (this._settings.columnAutosizing) {
            return false;
        } else {
            this._settings.columnAutosizing = true;
            this._settings.columnAutosized = false; // make sure an initial autosize happens
            return true;
        }
    }

    checkColumnAutosizing(force: boolean) {
        const settings = this._settings;
        let autoSized: boolean;

        if (settings.columnAutosizing) {
            const width = settings.width;
            const preferredWidth = settings.preferredWidth ?? width;
            force = force || !settings.columnAutosized;
            if (width !== preferredWidth || force && preferredWidth !== undefined) {
                settings.width = force ? preferredWidth : Math.max(width, preferredWidth);
                if (settings.columnAutosizingMax && settings.width > settings.columnAutosizingMax) {
                    settings.width = settings.columnAutosizingMax;
                }
                settings.columnAutosized = !isNaN(settings.width);
                autoSized = settings.width !== width;
            } else {
                autoSized = false;
            }
        } else {
            autoSized = false;
        }

        return autoSized;
    }

    // set properties(properties) {
    //     this.addProperties(properties, true);
    // }

    /**
     * @desc Amend properties for this hypergrid only.
     * @param properties - A simple properties hash.
     */
    addProperties(properties: Partial<ColumnSettings>) {
        this._settings.merge(properties);
    }

    /**
     * @returns '' if data value is undefined
     * @internal
     */
    getValueFromDataRow(dataRow: DataModel.DataRow): DataModel.DataValue {
        if (Array.isArray(dataRow)) {
            return dataRow[this.schemaColumn.index];
        } else {
            return dataRow[this.name];
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
     * The cell's `format` property is mixed into the provided cellEvent for possible overriding by developer's override of {@link DataModel.prototype.getCellEditorAt} before being used by {@link CellEditor} to parse and format the cell value.
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

/** @public */
export interface ColumnsDataValuesObject {
    [columnName: string]: DataModel.DataValue[];
}

/** @public */
export interface ColumnWidth {
    column: ColumnInterface;
    width: number | undefined;
}
