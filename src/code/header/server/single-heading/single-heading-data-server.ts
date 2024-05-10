// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevAssertError, RevDataServer } from '../../../common/internal-api';
import { RevSingleHeadingField } from './single-heading-field';

/** @public */
export class RevSingleHeadingDataServer<SF extends RevSingleHeadingField> implements RevDataServer<SF> {
    private _callbackListeners: RevDataServer.NotificationsClient[] = [];

    subscribeDataNotifications(listener: RevDataServer.NotificationsClient) {
        this._callbackListeners.push(listener)
    }

    unsubscribeDataNotifications(client: RevDataServer.NotificationsClient) {
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
