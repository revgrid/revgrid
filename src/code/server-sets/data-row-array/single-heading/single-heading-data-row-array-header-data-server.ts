
import { AssertError, DataServer } from '../../../grid/grid-public-api';
import { SingleHeadingDataRowArraySchemaField } from './single-heading-data-row-array-schema-field';

/** @public */
export class SingleHeadingDataRowArrayHeaderDataServer<SF extends SingleHeadingDataRowArraySchemaField> implements DataServer<SF> {
    private _callbackListeners: DataServer.NotificationsClient[] = [];

    subscribeDataNotifications(listener: DataServer.NotificationsClient) {
        this._callbackListeners.push(listener)
    }

    unsubscribeDataNotifications(client: DataServer.NotificationsClient) {
        const idx = this._callbackListeners.findIndex((element) => element === client);
        if (idx < 0) {
            throw new AssertError('SHDRAHSSUDN65539');
        } else {
            this._callbackListeners.splice(idx, 1);
        }
    }

    getRowCount() {
        return 1;
    }

    getViewValue(field: SF, rowIndex: number) {
        if (rowIndex !== 0) {
            return field.name;
        } else {
            return field.heading;
        }
    }

    reset() {
        this._callbackListeners.forEach((listener) => listener.rowsLoaded());
    }
}
