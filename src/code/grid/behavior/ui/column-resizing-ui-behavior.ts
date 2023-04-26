
import { ViewportCell } from '../../cell/viewport-cell';
import { ColumnRowResizingUiBehavior } from './column-row-resizing-ui-behavior';

export class ColumnResizingUiBehavior extends ColumnRowResizingUiBehavior {

    readonly typeName = ColumnResizingUiBehavior.typeName;

    override getMouseOffset(event: MouseEvent): number {
        return event.offsetX;
    }

    /**
     * @desc returns the index of which divider I'm over
     */
    override overAreaDivider(cell: ViewportCell): boolean {
        const mousePoint = cell.mousePoint.x;
        if (!this.gridProperties.gridRightAligned) {
            const leftMostColumnIndex = 0;
            return (cell.gridCell.x !== leftMostColumnIndex && mousePoint <= 3) || mousePoint >= cell.bounds.width - 3;
        } else {
            const lastVisibleColumnIdx = this.viewport.columns.length - 1;
            if (lastVisibleColumnIdx < 0) {
                return false;
            } else {
                const lastVc = this.viewport.columns[lastVisibleColumnIdx];
                const lastColumnIndex = lastVc.activeColumnIndex;
                return (mousePoint >= -1 && mousePoint <= 3) || (cell.gridCell.x !== lastColumnIndex && mousePoint >= cell.bounds.width - 3);
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

export namespace ColumnResizingUiBehavior {
    export const typeName = 'columnresizing';
}
