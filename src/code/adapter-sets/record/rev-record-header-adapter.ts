import { DataServer } from '../../grid/grid-public-api';
import { RevRecordField } from './rev-record-field';

/** @public */
export class RevRecordHeaderAdapter implements DataServer {

    private _dataCallbackListener: DataServer.NotificationsClient;

    constructor(private _rowCount = 1) {

    }

    subscribeDataNotifications(value: DataServer.NotificationsClient): void {
        this._dataCallbackListener = value;
    }

    getValue(schemaColumn: RevRecordField.SchemaColumn, _rowCount: number): string {
        return schemaColumn.name;
    }

    getRowCount() {
        return this._rowCount;
    }

    invalidateCell(schemaColumnIndex: number, rowIndex = 0) {
        this._dataCallbackListener.invalidateCell(schemaColumnIndex, rowIndex);
    }
}
