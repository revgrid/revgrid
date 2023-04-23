// import { CellEvent } from './cell-event';
import { Viewport } from '../renderer/viewport';
import { ViewportCell } from './viewport-cell';

/** @public */
export class BeingPaintedCell extends ViewportCell {
    // partial render support
    snapshot: BeingPaintedCell.Snapshot;

    override reset(visibleColumn: Viewport.ViewportColumn, visibleRow: Viewport.ViewportRow) {
        // partial render support
        this.snapshot = {};

        super.reset(visibleColumn, visibleRow);
    }
}

/** @public */
export namespace BeingPaintedCell {
    export type Snapshot = Record<string, unknown>;
}
