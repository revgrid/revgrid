import { CellEditor, CellPainter, DataServer, DatalessViewCell } from '../../grid/grid-public-api';
import { TextCellPainter } from '../../standard-cell-painters/standard-cell-painters-public-api';
import { RevRecordField } from './rev-record-field';

/** @public */
export class RevRecordHeaderDataServer implements DataServer {
    readonly cellPainter: TextCellPainter;

    private _dataCallbackListener: DataServer.NotificationsClient;

    constructor(private _rowCount = 1) {
        this.cellPainter = new TextCellPainter(this);
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

    getCellPainter(viewCell: DatalessViewCell, cellEditorPainter: CellEditor.Painter | undefined): CellPainter {
        this.cellPainter.setCell(viewCell, cellEditorPainter);
        return this.cellPainter;
    }

    invalidateCell(schemaColumnIndex: number, rowIndex = 0) {
        this._dataCallbackListener.invalidateCell(schemaColumnIndex, rowIndex);
    }
}
