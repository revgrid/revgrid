import { DataModel } from '../../grid/grid-public-api';
import { RevRecordField } from './rev-record-field';

/** @public */
export class RevRecordHeaderAdapter implements DataModel {

    private _dataCallbackListener: DataModel.CallbackListener;

    constructor(private _rowCount = 1) {

    }

    addDataCallbackListener(value: DataModel.CallbackListener): void {
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
