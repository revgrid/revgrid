import { ViewportCell } from '../cell/viewport-cell';
import { ColumnsManager } from '../column/columns-manager';
import { GridProperties } from '../grid-properties';
import { Viewport } from '../renderer/viewport';
import { Subgrid } from '../subgrid/subgrid';

export class RendererBehavior {
    constructor(
        private readonly _gridProperties: GridProperties,
        private readonly _columnsManager: ColumnsManager,
        private readonly _viewport: Viewport,
    ) {

    }

    repaint() {
        if (this._gridProperties.repaintImmediately) {
            this.paintNow();
        } else {
            this._viewport.repaint();
        }
    }

    /**
     * @desc Paint immediately in this microtask.
     */
    paintNow() {
        if (this._columnsManager.columnsCreated) {
            this._viewport.paintNow();
        }
    }

    /** Promise resolves when last model update is rendered. Columns and rows will then reflect last model update */
    waitModelRendered() {
        return this._viewport.waitModelRendered();
    }

    resetCellPropertiesCache(xOrCellEvent: number | ViewportCell, y?: number, subgrid?: Subgrid) {
        this._viewport.resetCellPropertiesCache(xOrCellEvent, y, subgrid);
    }
}
