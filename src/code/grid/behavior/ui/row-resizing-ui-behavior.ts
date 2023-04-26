
import { CellEvent } from '../../cell/cell-event';
import { ViewportCell } from '../../cell/viewport-cell';
import { Point } from '../../lib/point';
import { Revgrid } from '../../revgrid';
import { Subgrid } from '../../subgrid/subgrid';
import { ColumnRowResizingUiBehavior } from './column-row-resizing-ui-behavior';

export class RowResizingUiBehavior extends ColumnRowResizingUiBehavior {

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
     * @desc get the mouse x,y coordinate
     * @param event - the mouse event to query
     */
    override getMouseOffset(event: MouseEvent) {
        return event.offsetY;
    }

    /**
     * @desc get the grid cell x,y coordinate
     */
    getGridCellValue(gridCell: Point): number {
        return gridCell.x;
    }

    /**
     * @desc return the grids x,y scroll value
     */
    getScrollValue(grid: Revgrid): number {
        return grid.rowScrollAnchorIndex;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    override getGridRightBottomAligned() {
        return false;
    }

    /**
     * @desc return the width/height of the row/column of interest
     * @param index - the row/column index of interest
     */
    private getAreaSize(grid: Revgrid, index: number, subgrid: Subgrid): number {
        return this.rowPropertiesBehavior.getRowHeight(index, subgrid);
    }

    /**
     * @desc set the width/height of the row/column at index
     * @param index - the row/column index of interest
     * @param value - the width/height to set to
     */
    private setAreaSize(grid: Revgrid, index: number, value: number, subgrid: Subgrid) {
        grid.setRowHeight(index, value, subgrid);
    }

    /**
     * @desc returns the index of which divider I'm over
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected override overAreaDivider(_cell: ViewportCell): boolean {
        return false; // previously returned void (undefined)
    }

    /**
     * @desc am I over the column/row area
     */
    private isFirstFixedOtherArea(event: CellEvent): boolean {
        return this.isFirstFixedColumn(event);
    }

    /**
     * @desc return the cursor name
     */
    override getCursorName() {
        return 'row-resize';
    }

    // isEnabled(grid: Hypergrid): boolean {
    //     return grid.isRowResizeable();
    // }
}

export namespace RowResizingUiBehavior {
    export const typeName = 'rowresizing';
}
