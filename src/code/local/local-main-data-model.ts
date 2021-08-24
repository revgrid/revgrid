import { AssertError } from '../lib/hypegrid-error';
import { DataModel } from '../model/data-model';
import { SchemaModel } from '../model/schema-model';

export class LocalMainDataModel implements SchemaModel, DataModel {
    private _dataCallbackListeners: DataModel.CallbackListener[] = [];
    private _schemaCallbackListeners: SchemaModel.CallbackListener[] = [];

    private _columns = new Array<SchemaModel.Column>();
    private _data: LocalDataRowObject[];

    addDataCallbackListener(listener: DataModel.CallbackListener) {
        this._dataCallbackListeners.push(listener)
    }

    removeDataCallbackListener(listener: DataModel.CallbackListener) {
        const idx = this._dataCallbackListeners.findIndex((element) => element === listener);
        if (idx < 0) {
            throw new AssertError('LMDMRDCL65539', 'LocalMainDataModel: DataCallbackListener not found');
        } else {
            this._dataCallbackListeners.splice(idx, 1);
        }
    }

    addSchemaCallbackListener(listener: SchemaModel.CallbackListener) {
        this._schemaCallbackListeners.push(listener)
    }

    removeSchemaCallbackListener(listener: SchemaModel.CallbackListener) {
        const idx = this._schemaCallbackListeners.findIndex((element) => element === listener);
        if (idx < 0) {
            throw new AssertError('LMDMRSCL91364', 'LocalMainSchemaModel: SchemaCallbackListener not found');
        } else {
            this._schemaCallbackListeners.splice(idx, 1);
        }
    }

    reset() {
        /**
         * @summary The array of column schema objects.
         * @name schema
         * @type {columnSchemaObject[]}
         */
        this._columns.length = 0;

        /**
         * @summary The array of uniform data objects.
         * @name data
         * @type {object[]}
         */
        this._data = [];
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getSchema}
     */
    getSchema(): readonly SchemaModel.Column[] {
        return this._columns;
    }

    /**
     * @summary Find first extant AND defined element.
     * @desc Uses for...in to find extant rows plus a truthiness test to return only a defined row.
     * @returns Returns undefined if there are no such rows.
     */
    getFirstRow() {
        for (const i in this._data) {
            if (this._data[i]) {
                return this._data[i];
            }
        }
        return undefined;
    }

    getRow(y: number) {
        return this._data[y];
    }

    /**
     * Update or blank row in place.
     *
     * _Note parameter order is the reverse of `addRow`._
     * @param dataRow - if omitted or otherwise falsy, row renders as blank
     */
    setRow(y: number, dataRow: LocalDataRowObject) {
        this._data[y] = dataRow || undefined;
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getRowMetadata}
     */
    getRowMetadata(y: number, prototype?: null) {
        const dataRow = this._data[y];
        return dataRow && (dataRow.__META || (prototype !== undefined && (dataRow.__META = Object.create(prototype))));
    }

    setRowMetadata(y: number, metadata: DataModel.RowMetadata) {
        const dataRow = this._data[y];
        if (dataRow) {
            if (metadata) {
                dataRow.__META = metadata;
            } else {
                delete dataRow.__META;
            }
        }
        return !!dataRow;
    }

    /**
     * Insert or append a new row.
     *
     * _Note parameter order is the reverse of `setRow`._
     * @param y - The index of the new row. If `y` >= row count, row is appended to end; otherwise row is inserted at `y` and row indexes of all remaining rows are incremented.
     */
    addRow(y: number, dataRow: LocalDataRowObject): void;
    addRow(dataRow: LocalDataRowObject): void;
    addRow(yOrDataRow: number | LocalDataRowObject, dataRow?: LocalDataRowObject) {
        let y: number;
        if (typeof yOrDataRow === 'number') {
            y = yOrDataRow;
        } else {
            dataRow = yOrDataRow;
            y = undefined;
        }
        if (y === undefined || y >= this.getRowCount()) {
            this._data.push(dataRow);
        } else {
            this._data.splice(y, 0, dataRow);
        }

        this._dataCallbackListeners.forEach((listener) => listener.dataShapeChanged());
    }

    /**
     * Rows are removed entirely and no longer render.
     * Indexes of all remaining rows are decreased by `rowCount`.
     */
    delRow(y: number, rowCount = 1) {
        const rows = this._data.splice(y, rowCount === undefined ? 1 : rowCount);
        if (rows.length) {
            this._dataCallbackListeners.forEach((listener) => listener.dataShapeChanged());
        }
        return rows;
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getValue}
     */
    getValue(schemaColumn: SchemaModel.Column, y: number) {
        const row = this._data[y];
        if (!row) {
            return null;
        }
        return row[schemaColumn.name];
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#setValue}
     */
    setValue(schemaColumn: SchemaModel.Column, y: number, value: unknown) {
        this._data[y][schemaColumn.name] = value;
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getRowCount}
     */
    getRowCount() {
        return this._data.length;
    }

    /**
     * Establish new data and schema.
     * If no data provided, data will be set to 0 rows.
     * If no schema provided AND no previously set schema, new schema will be derived from data.
     * @param {object[]} [data=[]] - Array of uniform objects containing the grid data.
     * @param {columnSchemaObject[]} [schema=[]]
     */
    setData(data: LocalDataRowObject[]) {
        /**
         * @summary The array of uniform data objects.
         */
        this._data = data ?? [];

        this.setSchema();

        this._dataCallbackListeners.forEach((listener) => listener.dataLoaded());
    }

    private setSchema() {
        const dataRow = this.getFirstRow();
        if (dataRow) {
            this._columns = Object.keys(dataRow).map((key) => ({ name: key }));
        } else {
            this._columns = [];
        }

        this._schemaCallbackListeners.forEach((listener) => listener.schemaLoaded());
    }
}

interface LocalDataRowObject extends DataModel.DataRowObject {
    __META?: DataModel.RowMetadata;
}
