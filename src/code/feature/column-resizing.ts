
import { Hypegrid } from '../grid/hypegrid';
import { CellEvent } from '../renderer/cell-event';
import { ColumnRowResizing } from './column-row-resizing';

export class ColumnResizing extends ColumnRowResizing {

    readonly typeName = ColumnResizing.typeName;

    override getMouseValue(event: CellEvent): number {
        return event.primitiveEvent.detail.mouse.x;
    }

    /**
     * @desc returns the index of which divider I'm over
     */
    override overAreaDivider(grid: Hypegrid, event: CellEvent): boolean {
        const mousePoint = event.mousePoint.x;
        if (!grid.properties.gridRightAligned) {
            const leftMostColumnIndex = 0;
            return (event.gridCell.x !== leftMostColumnIndex && mousePoint <= 3) || mousePoint >= event.bounds.width - 3;
        } else {
            const lastVisibleColumnIdx = grid.renderer.visibleColumns.length - 1;
            if (lastVisibleColumnIdx < 0) {
                return false;
            } else {
                const lastVc = grid.renderer.visibleColumns[lastVisibleColumnIdx];
                const lastColumnIndex = lastVc.columnIndex;
                return (mousePoint >= -1 && mousePoint <= 3) || (event.gridCell.x !== lastColumnIndex && mousePoint >= event.bounds.width - 3);
            }
        }
    }

    /**
     * @desc return the cursor name
     */
    override getCursorName() {
        return 'col-resize';
    }

    override getGridRightBottomAligned(grid: Hypegrid) {
        return grid.properties.gridRightAligned;
    }
}

export namespace ColumnResizing {
    export const typeName = 'columnresizing';
}
