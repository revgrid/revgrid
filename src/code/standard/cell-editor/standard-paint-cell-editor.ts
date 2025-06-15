import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevCellPainter, RevClientGrid, RevViewCell } from '../../client';
import { RevDataServer, RevSchemaField } from '../../common';
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
