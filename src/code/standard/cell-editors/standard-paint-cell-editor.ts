import { CellPainter, DataServer, DatalessViewCell, Revgrid, SchemaServer } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardCellEditor } from './standard-cell-editor';

export abstract class StandardPaintCellEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SC extends SchemaServer.Column<BCS>
> extends StandardCellEditor<BGS, BCS, SC> implements CellPainter<BCS, SC> {
    constructor(grid: Revgrid<BGS, BCS, SC>, dataServer: DataServer<BCS>, protected readonly _painter: CellPainter<BCS, SC>) {
        super(grid, dataServer);
    }

    paint(cell: DatalessViewCell<BCS, SC>, prefillColor: string | undefined) {
        return this._painter.paint(cell, prefillColor);
    }
}
