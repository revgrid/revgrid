
import { Subgrid } from '../../components/subgrid/subgrid';
import { Point } from '../../lib/point';
import { UiBehavior } from './ui-behavior';

export class RowResizingUiBehavior extends UiBehavior {

    readonly typeName = RowResizingUiBehavior.typeName;

    /**
     * the index of the row/column we are dragging
     */
    private dragArea = -1;

    /**
     * the starting width/height of the row/column we are dragging
     */
    private dragAreaStartingSize = -1;

    /**
     * @desc get the grid cell x,y coordinate
     */
    getGridCellValue(gridCell: Point): number {
        return gridCell.x;
    }

    /**
     * @desc return the grids x,y scroll value
     */
    getScrollValue(): number {
        return this.viewLayout.rowScrollAnchorIndex;
    }

    /**
     * @desc return the width/height of the row/column of interest
     * @param index - the row/column index of interest
     */
    private getAreaSize(index: number, subgrid: Subgrid): number {
        return subgrid.getRowHeight(index);
    }

    /**
     * @desc set the width/height of the row/column at index
     * @param index - the row/column index of interest
     * @param value - the width/height to set to
     */
    private setAreaSize(index: number, value: number, subgrid: Subgrid) {
        this.rowPropertiesBehavior.setRowHeight(index, value, subgrid);
    }

    // isEnabled(grid: Hypergrid): boolean {
    //     return grid.isRowResizeable();
    // }
}

export namespace RowResizingUiBehavior {
    export const typeName = 'rowresizing';

    export const cursorName = 'row-resize';
}