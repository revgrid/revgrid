
import { AssertError, DataServer } from '../../grid/grid-public-api';
import { RevSimpleSchemaAdapter } from './rev-simple-schema-adapter';

/** @public */
export class RevSimpleHeaderAdapter implements DataServer {

    private _rowCount = 0;
    private _callbackListeners: DataServer.NotificationsClient[] = [];

    subscribeDataNotifications(listener: DataServer.NotificationsClient) {
        this._callbackListeners.push(listener)
    }

    unsubscribeDataNotifications(listener: DataServer.NotificationsClient) {
        const idx = this._callbackListeners.findIndex((element) => element === listener);
        if (idx < 0) {
            throw new AssertError('HSARDCL65539', 'HeaderStaticAdapter: CallbackListener not found');
        } else {
            this._callbackListeners.splice(idx, 1);
        }
    }

    getRowCount() {
        return this._rowCount;
    }

    getValue(schemaColumn: RevSimpleSchemaAdapter.Column, rowIndex: number) {
        const headers = schemaColumn.headers;
        if (rowIndex >= headers.length) {
            return schemaColumn.name;
        } else {
            return headers[rowIndex];
        }
    }

    reset(rowCount: number) {
        this._rowCount = rowCount;
        this._callbackListeners.forEach((listener) => listener.rowsLoaded());
    }
}
