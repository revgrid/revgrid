import { RenderCellProperties } from '../cell-painter/render-cell-properties';
import { Renderer } from '../renderer/renderer';
// import { CellEvent } from './cell-event';
import { CellInfo } from './cell-info';

export class RenderCell extends CellInfo {
    // partial render support
    snapshot: RenderCellProperties.Snapshot[];
    minWidth: number | undefined;

    override reset(visibleColumn: Renderer.VisibleColumn, visibleRow: Renderer.VisibleRow) {
        // partial render support
        this.snapshot = [];
        this.minWidth = undefined;

        super.reset(visibleColumn, visibleRow);
    }
}

export namespace RenderCell {

}
