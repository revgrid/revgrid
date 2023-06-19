
import { Subgrid } from '../../interfaces/data/subgrid';
import { SchemaServer } from '../../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { Point } from '../../types-utils/point';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class RowResizingUiBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> extends UiBehavior<BGS, BCS, SF> {

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
    private getAreaSize(index: number, subgrid: Subgrid<BCS, SF>): number {
        return subgrid.getRowHeight(index);
    }

    /**
     * @desc set the width/height of the row/column at index
     * @param index - the row/column index of interest
     * @param value - the width/height to set to
     */
    private setAreaSize(index: number, value: number, subgrid: Subgrid<BCS, SF>) {
        this.rowPropertiesBehavior.setRowHeight(index, value, subgrid);
    }

    // isEnabled(grid: Hypergrid): boolean {
    //     return grid.isRowResizeable();
    // }
}

/** @internal */
export namespace RowResizingUiBehavior {
    export const typeName = 'rowresizing';

    export const cursorName = 'row-resize';
}
