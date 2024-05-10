// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevAssertError, RevDataServer } from '../../../common/internal-api';
import { RevMultiHeadingField } from './multi-heading-field';

/** @public */
export class RevMultiHeadingDataServer<SF extends RevMultiHeadingField> implements RevDataServer<SF> {
    private _rowCount = 0;
    private _callbackListeners: RevDataServer.NotificationsClient[] = [];

    subscribeDataNotifications(listener: RevDataServer.NotificationsClient) {
        this._callbackListeners.push(listener)
    }

    unsubscribeDataNotifications(client: RevDataServer.NotificationsClient) {
        const idx = this._callbackListeners.findIndex((element) => element === client);
        if (idx < 0) {
            throw new RevAssertError('HSARDCL65539');
        } else {
            this._callbackListeners.splice(idx, 1);
        }
    }

    getRowCount() {
        return this._rowCount;
    }

    getViewValue(field: SF, rowIndex: number) {
        const headings = field.headings;
        if (rowIndex >= headings.length) {
            return field.name;
        } else {
            return headings[rowIndex];
        }
    }

    reset(rowCount: number) {
        this._rowCount = rowCount;
        this._callbackListeners.forEach((listener) => { listener.rowsLoaded(); });
    }
}
