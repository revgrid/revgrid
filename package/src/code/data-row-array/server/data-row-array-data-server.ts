import { RevAssertError, RevDataServer, RevSchemaField } from '../../common/internal-api';

/** @public */
export class RevDataRowArrayDataServer<SF extends RevSchemaField> implements RevDataServer<SF> {
    private _data: RevDataServer.ObjectViewRow[] = [];
    private _callbackListeners: RevDataServer.NotificationsClient[] = [];

    get data() { return this._data; }

    subscribeDataNotifications(listener: RevDataServer.NotificationsClient) {
        this._callbackListeners.push(listener)
    }

    unsubscribeDataNotifications(listener: RevDataServer.NotificationsClient) {
        const idx = this._callbackListeners.findIndex((element) => element === listener);
        if (idx < 0) {
            throw new RevAssertError('MSARDCL65539', 'MainStaticAdapter: CallbackListener not found');
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

    reset(data?: RevDataServer.ObjectViewRow[]) {
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
    setViewRow(index: number, dataRow: RevDataServer.ObjectViewRow) {
        this._data[index] = dataRow;
        this._callbackListeners.forEach((listener) => { listener.invalidateRow(index); });
    }

    addRow(dataRow: RevDataServer.ObjectViewRow) {
        const index = this.getRowCount();
        this.insertRow(index, dataRow);
        return index;
    }

    insertRow(index: number, dataRow: RevDataServer.ObjectViewRow) {
        this._data.splice(index, 0, dataRow);
        this._callbackListeners.forEach((listener) => { listener.rowsInserted(index, 1); });
    }

    deleteRows(index: number, count = 1) {
        const rows = this._data.splice(index, count);
        if (rows.length > 0) {
            this._callbackListeners.forEach((listener) => { listener.rowsDeleted(index, count); });
        }
        return rows;
    }

    getViewValue(field: SF, y: number) {
        const row = this._data[y];
        return row[field.name];
    }

    setEditValue(field: SF, y: number, value: unknown) {
        this._data[y][field.name] = value;
        this._callbackListeners.forEach((listener) => { listener.invalidateCell(field.index, y); });
    }

    getRowCount() {
        return this._data.length;
    }
}
