import { AssertError, DataServer, SchemaField } from '../../grid/grid-public-api';

/** @public */
export class DataRowArrayDataServer<SF extends SchemaField> implements DataServer<SF> {
    private _data: DataServer.ObjectViewRow[] = [];
    private _callbackListeners: DataServer.NotificationsClient[] = [];

    subscribeDataNotifications(listener: DataServer.NotificationsClient) {
        this._callbackListeners.push(listener)
    }

    unsubscribeDataNotifications(listener: DataServer.NotificationsClient) {
        const idx = this._callbackListeners.findIndex((element) => element === listener);
        if (idx < 0) {
            throw new AssertError('MSARDCL65539', 'MainStaticAdapter: CallbackListener not found');
        } else {
            this._callbackListeners.splice(idx, 1);
        }
    }

    beginDataChange() {
        this._callbackListeners.forEach((listener) => { listener.beginChange(); });
    }

    endDataChange() {
        this._callbackListeners.forEach((listener) => { listener.endChange(); });
    }

    reset(data?: DataServer.ObjectViewRow[]) {
        if (data === undefined) {
            this.invalidateAll();
        } else {
            this._data = data;
            this._callbackListeners.forEach((listener) => { listener.rowsLoaded(); });
        }
    }

    invalidateAll(): void {
        for (const callbackListener of this._callbackListeners) {
            callbackListener.invalidateAll();
        }
    }

    getViewRow(index: number) {
        return this._data[index];
    }

    /**
     * Update or blank row in place.
     *
     * _Note parameter order is the reverse of `addRow`._
     * @param dataRow - if omitted or otherwise falsy, row renders as blank
     */
    setViewRow(index: number, dataRow: DataServer.ObjectViewRow) {
        this._data[index] = dataRow || undefined;
        this._callbackListeners.forEach((listener) => { listener.invalidateRow(index); });
    }

    /**
     * Insert or append a new row.
     *
     * _Note parameter order is the reverse of `setRow`._
     * @param index - The index of the new row. If `y` >= row count, row is appended to end; otherwise row is inserted at `y` and row indexes of all remaining rows are incremented.
     */
    addRow(dataRow: DataServer.ObjectViewRow): void;
    addRow(index: number, dataRow: DataServer.ObjectViewRow): void;
    addRow(indexOrDataRow: number | DataServer.ObjectViewRow, dataRowOrUndefined?: DataServer.ObjectViewRow): void {
        const rowCount = this.getRowCount();
        let index: number;
        let dataRow: DataServer.ObjectViewRow;
        if (typeof indexOrDataRow === 'number') {
            index = indexOrDataRow;
            if (dataRowOrUndefined === undefined) {
                throw new AssertError('DRADSAR09118');
            } else {
                dataRow = dataRowOrUndefined;
            }
        } else {
            index = rowCount;
            dataRow = indexOrDataRow;
        }

        if (index >= rowCount) {
            index = rowCount;
            this._data.push(dataRow);
        } else {
            this._data.splice(index, 0, dataRow);
        }

        this._callbackListeners.forEach((listener) => { listener.rowsInserted(index, 1); });
    }

    /**
     * Rows are removed entirely and no longer render.
     * Indexes of all remaining rows are decreased by `rowCount`.
     */
    delRow(index: number, count = 1) {
        const rows = this._data.splice(index, count === undefined ? 1 : count);
        if (rows.length) {
            this._callbackListeners.forEach((listener) => { listener.invalidateRows(index, count); });
        }
        return rows;
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getValue}
     */
    getViewValue(field: SF, y: number) {
        const row = this._data[y];
        if (!row) {
            return null;
        }
        return row[field.name];
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#setValue}
     */
    setEditValue(field: SF, y: number, value: unknown) {
        this._data[y][field.name] = value;
        this._callbackListeners.forEach((listener) => { listener.invalidateCell(field.index, y); });
    }

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getRowCount}
     */
    getRowCount() {
        return this._data.length;
    }
}
