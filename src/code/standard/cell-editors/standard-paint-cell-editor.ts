import { CellPainter, DataServer, DatalessViewCell, Revgrid, SchemaField } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardCellEditor } from './standard-cell-editor';

export abstract class StandardPaintCellEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SF extends SchemaField<BCS>
> extends StandardCellEditor<BGS, BCS, SF> implements CellPainter<BCS, SF> {
    constructor(grid: Revgrid<BGS, BCS, SF>, dataServer: DataServer<BCS, SF>, protected readonly _painter: CellPainter<BCS, SF>) {
        super(grid, dataServer);
    }

    paint(cell: DatalessViewCell<BCS, SF>, prefillColor: string | undefined) {
        return this._painter.paint(cell, prefillColor);
    }
}
