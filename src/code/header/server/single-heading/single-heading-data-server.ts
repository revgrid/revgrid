// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { DataServer, RevAssertError } from '../../../client/internal-api';
import { RevSingleHeadingSchemaField } from './single-heading-schema-field';

/** @public */
export class RevSingleHeadingDataServer<SF extends RevSingleHeadingSchemaField> implements DataServer<SF> {
    private _callbackListeners: DataServer.NotificationsClient[] = [];

    subscribeDataNotifications(listener: DataServer.NotificationsClient) {
        this._callbackListeners.push(listener)
    }

    unsubscribeDataNotifications(client: DataServer.NotificationsClient) {
        const idx = this._callbackListeners.findIndex((element) => element === client);
        if (idx < 0) {
            throw new RevAssertError('SHDRAHSSUDN65539');
        } else {
            this._callbackListeners.splice(idx, 1);
        }
    }

    getRowCount() {
        return 1;
    }

    getViewValue(field: SF) {
        return field.heading;
    }

    reset() {
        this._callbackListeners.forEach((listener) => { listener.rowsLoaded(); });
    }

    invalidateCell(schemaColumnIndex: number, rowIndex = 0) {
        for (const callbackListener of this._callbackListeners) {
            callbackListener.invalidateCell(schemaColumnIndex, rowIndex);
        }
    }
}
