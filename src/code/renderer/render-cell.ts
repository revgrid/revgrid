// import { CellEvent } from './cell-event';
import { CellInfo } from './cell-info';
import { Renderer } from './renderer';

/** @public */
export class RenderCell extends CellInfo {
    // partial render support
    snapshot: RenderCell.Snapshot;
    minWidth: number | undefined;

    override reset(visibleColumn: Renderer.VisibleColumn, visibleRow: Renderer.VisibleRow) {
        // partial render support
        this.snapshot = [];
        this.minWidth = undefined;

        super.reset(visibleColumn, visibleRow);
    }
}

/** @public */
export namespace RenderCell {
    export type SubrowSnapshot = Record<string, unknown>
    export type Snapshot = SubrowSnapshot[];
}
