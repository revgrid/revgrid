
import { Hypergrid } from '../grid/hypergrid';
import { CellEvent } from '../lib/cell-event';
import { ColumnRowResizing } from './column-row-resizing';

export class ColumnResizing extends ColumnRowResizing {

    readonly typeName = ColumnResizing.typeName;

    override getMouseValue(event: CellEvent): number {
        return event.primitiveEvent.detail.mouse.x;
    }

    /**
     * @desc returns the index of which divider I'm over
     */
    override overAreaDivider(grid: Hypergrid, event: CellEvent): boolean {
        const leftMostColumnIndex = grid.behavior.leftMostColIndex;
        return event.gridCell.x !== leftMostColumnIndex && event.mousePoint.x <= 3 ||
            event.mousePoint.x >= event.bounds.width - 3;
    }

    /**
     * @desc return the cursor name
     */
    override getCursorName() {
        return 'col-resize';
    }

}

export namespace ColumnResizing {
    export const typeName = 'columnresizing';
}
