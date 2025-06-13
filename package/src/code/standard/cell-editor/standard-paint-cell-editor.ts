import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevCellPainter, RevClientGrid, RevViewCell } from '../../client/internal-api';
import { RevDataServer, RevSchemaField } from '../../common/internal-api';
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

    paint(cell: RevViewCell<BCS, SF>, prefillColor: string | undefined) {
        return this._painter.paint(cell, prefillColor);
    }
}
