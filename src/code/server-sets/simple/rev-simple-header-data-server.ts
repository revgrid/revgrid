
import { AssertError, DataServer } from '../../grid/grid-public-api';
import { RevSimpleSchemaServer } from './rev-simple-schema-server';

/** @public */
export class RevSimpleHeaderDataServer<SF extends RevSimpleSchemaServer.Field> implements DataServer<SF> {
    private _rowCount = 0;
    private _callbackListeners: DataServer.NotificationsClient[] = [];

    subscribeDataNotifications(listener: DataServer.NotificationsClient) {
        this._callbackListeners.push(listener)
    }

    unsubscribeDataNotifications(client: DataServer.NotificationsClient) {
        const idx = this._callbackListeners.findIndex((element) => element === client);
        if (idx < 0) {
            throw new AssertError('HSARDCL65539');
        } else {
            this._callbackListeners.splice(idx, 1);
        }
    }

    getRowCount() {
        return this._rowCount;
    }

    getViewValue(field: SF, rowIndex: number) {
        const headers = field.headers;
        if (rowIndex >= headers.length) {
            return field.name;
        } else {
            return headers[rowIndex];
        }
    }

    reset(rowCount: number) {
        this._rowCount = rowCount;
        this._callbackListeners.forEach((listener) => listener.rowsLoaded());
    }
}
