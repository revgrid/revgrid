
import { AssertError, CellPainter, DataServer, DatalessViewCell } from '../../grid/grid-public-api';
import { AlphaTextCellPainter } from '../../standard-cell-painters/standard-cell-painters-public-api';
import { RevSimpleSchemaServer } from './rev-simple-schema-server';

/** @public */
export class RevSimpleHeaderDataServer implements DataServer {
        readonly cellPainter: AlphaTextCellPainter;

    private _rowCount = 0;
    private _callbackListeners: DataServer.NotificationsClient[] = [];

    constructor() {
        this.cellPainter = new AlphaTextCellPainter(this);
    }

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

    getValue(schemaColumn: RevSimpleSchemaServer.Column, rowIndex: number) {
        const headers = schemaColumn.headers;
        if (rowIndex >= headers.length) {
            return schemaColumn.name;
        } else {
            return headers[rowIndex];
        }
    }

    getCellPainter(viewCell: DatalessViewCell): CellPainter {
        this.cellPainter.setCell(viewCell);
        return this.cellPainter;
    }

    reset(rowCount: number) {
        this._rowCount = rowCount;
        this._callbackListeners.forEach((listener) => listener.rowsLoaded());
    }
}
