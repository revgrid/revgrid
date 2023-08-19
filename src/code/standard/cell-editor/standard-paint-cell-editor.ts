import { BehavioredColumnSettings, BehavioredGridSettings, CellPainter, DataServer, DatalessViewCell, Revgrid, SchemaField } from '../../grid/grid-public-api';
import { StandardCellEditor } from './standard-cell-editor';

/** @public */
export abstract class StandardPaintCellEditor<
    BGS extends BehavioredGridSettings,
    BCS extends BehavioredColumnSettings,
    SF extends SchemaField
> extends StandardCellEditor<BGS, BCS, SF> implements CellPainter<BCS, SF> {
    constructor(grid: Revgrid<BGS, BCS, SF>, dataServer: DataServer<SF>, protected readonly _painter: CellPainter<BCS, SF>) {
        super(grid, dataServer);
    }

    paint(cell: DatalessViewCell<BCS, SF>, prefillColor: string | undefined) {
        return this._painter.paint(cell, prefillColor);
    }
}
