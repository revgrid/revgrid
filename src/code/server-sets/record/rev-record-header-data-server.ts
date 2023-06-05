import { BehavioredColumnSettings, DataServer } from '../../grid/grid-public-api';
import { RevRecordField } from './rev-record-field';

/** @public */
export class RevRecordHeaderDataServer<BCS extends BehavioredColumnSettings> implements DataServer<BCS> {
    private _dataCallbackListener: DataServer.NotificationsClient;

    constructor(private _rowCount = 1) {
    }

    subscribeDataNotifications(value: DataServer.NotificationsClient): void {
        this._dataCallbackListener = value;
    }

    getValue(schemaColumn: RevRecordField.SchemaColumn<BCS>, _rowCount: number): string {
        return schemaColumn.name;
    }

    getRowCount() {
        return this._rowCount;
    }

    invalidateCell(schemaColumnIndex: number, rowIndex = 0) {
        this._dataCallbackListener.invalidateCell(schemaColumnIndex, rowIndex);
    }
}
