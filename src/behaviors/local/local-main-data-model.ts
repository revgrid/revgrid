import { DataModel } from '../../lib/data-model';

export class LocalMainDataModel implements DataModel {
    private handlers: DataModel.EventListener[] = [];

    schema: DataModel.ColumnSchema[];
    data: DataModel.DataRowObject[];

    reset() {
        /**
         * @summary The array of column schema objects.
         * @name schema
         * @type {columnSchemaObject[]}
         * @memberOf DatasaurLocal#
         */
        this.schema = [];

        /**
         * @summary The array of uniform data objects.
         * @name data
         * @type {object[]}
         * @memberOf DatasaurLocal#
         */
        this.data = [];
    }

    dispatchEvent(nameOrEvent: DataModel.EventName | DataModel.Event) {
        this.handlers.forEach((handler) => {
            handler(nameOrEvent);
        });
    }

    addListener(handler: DataModel.EventListener) {
        if (this.handlers.indexOf(handler) < 0) {
            this.handlers.push(handler);
        }
    }

    removeListener(handler: DataModel.EventListener) {
        const index = this.handlers.indexOf(handler);
        if (index >= 0) {
            this.handlers.splice(index, 1);
        }
    }

    removeAllListeners() {
        this.handlers.length = 0;
    }

    /**
     * Establish new data and schema.
     * If no data provided, data will be set to 0 rows.
     * If no schema provided AND no previously set schema, new schema will be derived from data.
     * @param {object[]} [data=[]] - Array of uniform objects containing the grid data.
     * @param {columnSchemaObject[]} [schema=[]]
     * @memberOf DatasaurLocal#
     */
    setData(data: DataModel.DataRowObject[], schema: DataModel.ColumnSchema[]) {
        /**
         * @summary The array of uniform data objects.
         * @name data
         * @type {object[]}
         * @memberOf DatasaurLocal#
         */
        this.data = data || [];

        if (schema) {
            this.setSchema(schema);
        } else if (this.data.length && !this.schema.length) {
            this.setSchema([]);
        }

        this.dispatchEvent('fin-hypergrid-data-loaded');
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getSchema}
     */
    getSchema() {
        return this.schema;
    }

    setSchema(newSchema: DataModel.ColumnSchema[]){
        if (!newSchema.length) {
            const dataRow = this.getFirstRow();
            if (dataRow) {
                newSchema = Object.keys(dataRow).map((key) => <DataModel.ColumnSchema>{ name: key });
            }
        }

        this.schema = newSchema;
        this.dispatchEvent('fin-hypergrid-schema-loaded');
    }

    /**
     * @summary Find first extant AND defined element.
     * @desc Uses for...in to find extant rows plus a truthiness test to return only a defined row.
     * @returns Returns undefined if there are no such rows.
     */
    getFirstRow() {
        for (const i in this.data) {
            if (this.data[i]) {
                return this.data[i];
            }
        }
        return undefined;
    }

    getRow(y: number) {
        return this.data[y];
    }

    /**
     * Update or blank row in place.
     *
     * _Note parameter order is the reverse of `addRow`._
     * @param dataRow - if omitted or otherwise falsy, row renders as blank
     * @memberOf DatasaurLocal#
     */
    setRow(y: number, dataRow: DataModel.DataRowObject) {
        this.data[y] = dataRow || undefined;
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getRowMetadata}
     * @memberOf DatasaurLocal#
     */
    getRowMetadata(y: number, prototype?: null) {
        const dataRow = this.data[y];
        return dataRow && (dataRow.__META || (prototype !== undefined && (dataRow.__META = Object.create(prototype))));
    }

    setRowMetadata(y: number, metadata: DataModel.RowMetadata) {
        const dataRow = this.data[y];
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
    addRow(y: number, dataRow: DataModel.DataRowObject): void;
    addRow(dataRow: DataModel.DataRowObject): void;
    addRow(yOrDataRow: number | DataModel.DataRowObject, dataRow?: DataModel.DataRowObject) {
        let y: number;
        if (typeof yOrDataRow === 'number') {
            y = yOrDataRow;
        } else {
            dataRow = yOrDataRow;
            y = undefined;
        }
        if (y === undefined || y >= this.getRowCount()) {
            this.data.push(dataRow);
        } else {
            this.data.splice(y, 0, dataRow);
        }
        this.dispatchEvent('fin-hypergrid-data-shape-changed');
    }

    /**
     * Rows are removed entirely and no longer render.
     * Indexes of all remaining rows are decreased by `rowCount`.
     */
    delRow(y: number, rowCount = 1) {
        const rows = this.data.splice(y, rowCount === undefined ? 1 : rowCount);
        if (rows.length) {
            this.dispatchEvent('fin-hypergrid-data-shape-changed');
        }
        return rows;
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getValue}
     */
    getValue(x: number, y: number) {
        const row = this.data[y];
        if (!row) {
            return null;
        }
        return row[this.schema[x].name];
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#setValue}
     */
    setValue(x: number, y: number, value: unknown) {
        this.data[y][this.schema[x].name] = value;
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getRowCount}
     */
    getRowCount() {
        return this.data.length;
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getColumnCount}
     */
    getColumnCount() {
        return this.schema.length;
    }
}
