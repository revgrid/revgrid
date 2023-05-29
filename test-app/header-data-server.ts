import { CellEditor, CellPainter, DataServer, DatalessViewCell, SchemaServer, TextCellPainter } from '..';
import { SchemaServerImplementation } from './schema-adapter';

export class HeaderDataServer implements DataServer {
    readonly cellPainter: TextCellPainter;

    constructor() {
        this.cellPainter = new TextCellPainter(this);
    }

    getRowCount() {
        return 1;
    }

    getValue(schemaColumn: SchemaServer.Column) {
        return (schemaColumn as SchemaServerImplementation.Column).header;
    }

    getCellPainter(viewCell: DatalessViewCell, cellEditorPainter: CellEditor.Painter | undefined): CellPainter {
        this.cellPainter.setCell(viewCell, cellEditorPainter);
        return this.cellPainter;
    }

    subscribeDataNotifications() {
        // not used
    }
}
