import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevCellPainter, RevClientGrid, RevDataServer, RevDatalessViewCell, RevSchemaField } from '../../client/internal-api';
import { RevStandardCellEditor } from './standard-cell-editor';

/** @public */
export abstract class RevStandardPaintCellEditor<
    BGS extends RevBehavioredGridSettings,
    BCS extends RevBehavioredColumnSettings,
    SF extends RevSchemaField
> extends RevStandardCellEditor<BGS, BCS, SF> implements RevCellPainter<BCS, SF> {
    constructor(grid: RevClientGrid<BGS, BCS, SF>, dataServer: RevDataServer<SF>, protected readonly _painter: RevCellPainter<BCS, SF>) {
        super(grid, dataServer);
    }

    paint(cell: RevDatalessViewCell<BCS, SF>, prefillColor: string | undefined) {
        return this._painter.paint(cell, prefillColor);
    }
}
