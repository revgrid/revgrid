import { DataServer } from '../../grid/grid-public-api';
import { RevRecordField } from './rev-record-field';

/** @public */
export class RevRecordHeaderDataServer<SF extends RevRecordField> implements DataServer<SF> {
    private _dataCallbackListener: DataServer.NotificationsClient;

    constructor(private _rowCount = 1) {
    }

    subscribeDataNotifications(value: DataServer.NotificationsClient): void {
        this._dataCallbackListener = value;
    }

    getViewValue(field: SF, _rowCount: number): string {
        return field.name;
    }

    getRowCount() {
        return this._rowCount;
    }

    invalidateCell(schemaColumnIndex: number, rowIndex = 0) {
        this._dataCallbackListener.invalidateCell(schemaColumnIndex, rowIndex);
    }
}
