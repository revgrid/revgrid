import { CellPainter, DataServer, DatalessViewCell, HeaderTextCellPainter, SchemaServer } from '..';
import { SchemaServerImplementation } from './schema-adapter';

export class HeaderDataServer implements DataServer {
    readonly cellPainter: HeaderTextCellPainter;

    constructor() {
        this.cellPainter = new HeaderTextCellPainter(this);
    }

    getRowCount() {
        return 1;
    }

    getValue(schemaColumn: SchemaServer.Column) {
        return (schemaColumn as SchemaServerImplementation.Column).header;
    }

    getCellPainter(viewCell: DatalessViewCell): CellPainter {
        this.cellPainter.setCell(viewCell);
        return this.cellPainter;
    }

    subscribeDataNotifications() {
        // not used
    }
}
