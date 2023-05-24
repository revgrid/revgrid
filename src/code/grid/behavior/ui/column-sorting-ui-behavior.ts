import { ViewCell } from '../../components/cell/view-cell';
import { ColumnSettings } from '../../interfaces/column-settings';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class ColumnSortingUiBehavior extends UiBehavior {

    readonly typeName = ColumnSortingUiBehavior.typeName;

    override handleClick(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (!this.sharedState.mouseDownUpClickUsedForMoveOrResize) {
            if (cell === undefined) {
                cell = this.tryGetViewCellFromMouseEvent(event);
            }
            if (cell !== null) {
                this.sort(event, cell, false);
            }
        }
        return super.handleClick(event, cell);
    }

    override handleDblClick(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewCellFromMouseEvent(event);
        }
        if (cell !== null) {
            this.sort(event, cell, true);
        }
        return super.handleClick(event, cell);
    }

    override handleMouseMove(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewCellFromMouseEvent(event);
        }
        if (cell !== null) {
            if (cell.isHeaderOrRowFixed) {
                const columnProperties = this.columnsManager.getActiveColumnProperties(cell.viewLayoutColumn.activeColumnIndex);
                if ((columnProperties !== undefined) && columnProperties.sortable) {
                    this.cursor = 'pointer';
                } else {
                    this.cursor = undefined;
                }
            } else {
                this.cursor = undefined;
            }
        }

        return super.handleMouseMove(event, cell);
    }

    private sort(event: MouseEvent, cell: ViewCell, onDoubleClick: boolean) {
        let columnProperties: ColumnSettings;
        if (
            cell.isHeader &&
            (columnProperties = cell.columnProperties).sortable &&
            !(columnProperties.sortOnDoubleClick !== onDoubleClick) // both same (true or falsy)?
        ) {
            this.eventBehavior.processColumnSortEvent(event, cell);
        }
    }
}

/** @internal */
export namespace ColumnSortingUiBehavior {
    export const typeName = 'columnsorting';
}
