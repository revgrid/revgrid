
import { CellEvent, MouseCellEvent } from '../cell/cell-event';
import { ColumnRowResizing } from './column-row-resizing-feature';

export class ColumnResizing extends ColumnRowResizing {

    readonly typeName = ColumnResizing.typeName;

    override getMouseValue(event: MouseCellEvent): number {
        return event.mouse.mouse.x;
    }

    /**
     * @desc returns the index of which divider I'm over
     */
    override overAreaDivider(event: CellEvent): boolean {
        const mousePoint = event.mousePoint.x;
        if (!this.gridProperties.gridRightAligned) {
            const leftMostColumnIndex = 0;
            return (event.gridCell.x !== leftMostColumnIndex && mousePoint <= 3) || mousePoint >= event.bounds.width - 3;
        } else {
            const lastVisibleColumnIdx = this.viewport.columns.length - 1;
            if (lastVisibleColumnIdx < 0) {
                return false;
            } else {
                const lastVc = this.viewport.columns[lastVisibleColumnIdx];
                const lastColumnIndex = lastVc.activeColumnIndex;
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

    override getGridRightBottomAligned() {
        return this.gridProperties.gridRightAligned;
    }
}

export namespace ColumnResizing {
    export const typeName = 'columnresizing';
}
