
import { RevSubgrid } from '../../interfaces/data/subgrid';
import { RevSchemaField } from '../../interfaces/schema/schema-field';
import { RevBehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { RevBehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { RevPoint } from '../../types-utils/point';
import { RevUiController } from './ui-controller';

/** @internal */
export class RevRowResizingUiController<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevUiController<BGS, BCS, SF> {

    readonly typeName = RevRowResizingUiController.typeName;

    /**
     * the index of the row/column we are dragging
     */
    private dragArea = -1;

    /**
     * the starting width/height of the row/column we are dragging
     */
    private dragAreaStartingSize = -1;

    /**
     * get the grid cell x,y coordinate
     */
    getGridCellValue(gridCell: RevPoint): number {
        return gridCell.x;
    }

    /**
     * return the grids x,y scroll value
     */
    getScrollValue(): number {
        return this.viewLayout.rowScrollAnchorIndex;
    }

    /**
     * return the width/height of the row/column of interest
     * @param index - the row/column index of interest
     */
    private getAreaSize(index: number, subgrid: RevSubgrid<BCS, SF>): number {
        return subgrid.getRowHeight(index);
    }

    /**
     * set the width/height of the row/column at index
     * @param index - the row/column index of interest
     * @param value - the width/height to set to
     */
    private setAreaSize(index: number, value: number, subgrid: RevSubgrid<BCS, SF>) {
        this.rowPropertiesBehavior.setRowHeight(index, value, subgrid);
    }

    // isEnabled(grid: Hypergrid): boolean {
    //     return grid.isRowResizeable();
    // }
}

/** @internal */
export namespace RevRowResizingUiController {
    export const typeName = 'rowresizing';

    export const cursorName = 'row-resize';
}
