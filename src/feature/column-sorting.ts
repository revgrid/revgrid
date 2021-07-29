
import { ColumnProperties } from '../behaviors/column-properties';
import { Hypergrid } from '../grid/hypergrid';
import { CellEvent } from '../lib/cell-event';
import { Feature } from './feature';

export class ColumnSorting extends Feature {

    readonly typeName = ColumnSorting.typeName;

    override handleClick(grid: Hypergrid, event: CellEvent) {
        this.sort(grid, event, false);
    }

    override handleDoubleClick(grid: Hypergrid, event: CellEvent) {
        this.sort(grid, event, true);
    }

    override handleMouseMove(grid: Hypergrid, event: CellEvent) {
        if (event !== undefined) {
            let columnProperties: ColumnProperties;
            if (
                event.isRowFixed &&
                event.isHeaderCell &&
                (columnProperties = grid.behavior.getColumnProperties(event.gridCell.x)) &&
                !columnProperties.unsortable
            ) {
                this.cursor = 'pointer';
            } else {
                this.cursor = null;
            }
        }

        super.handleMouseMove(grid, event);
    }

    private sort(grid: Hypergrid, event: CellEvent, onDoubleClick: boolean) {
        let columnProperties: ColumnProperties;
        if (
            event.isHeaderCell &&
            !(columnProperties = event.columnProperties).unsortable &&
            !(columnProperties.sortOnDoubleClick !== onDoubleClick) // both same (true or falsy)?
        ) {
            grid.fireSyntheticColumnSortEvent(event.gridCell.x, event.primitiveEvent.detail.keys);
        }

        if (this.next) {
            this.next[onDoubleClick ? 'handleDoubleClick' : 'handleClick'](grid, event);
        }
    }
}

export namespace ColumnSorting {
    export const typeName = 'columnsorting';

    export interface ColumnSortEvent {
        column: number;
        keys: string[];
    }
}
