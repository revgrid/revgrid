import { ViewCell } from '../../components/cell/view-cell';
import { EventDetail } from '../../components/event/event-detail';
import { ColumnSettings } from '../../interfaces/column-settings';
import { UiBehavior } from './ui-behavior';

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

    override handleDoubleClick(event: MouseEvent, cell: ViewCell | null | undefined) {
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
            if (cell.isRowFixed && cell.isHeaderCell) {
                const columnProperties = this.columnsManager.getActiveColumnProperties(cell.visibleColumn.activeColumnIndex);
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
            cell.isHeaderCell &&
            (columnProperties = cell.columnProperties).sortable &&
            !(columnProperties.sortOnDoubleClick !== onDoubleClick) // both same (true or falsy)?
        ) {
            const eventDetail: EventDetail.ColumnSort = {
                time: Date.now(),
                column: cell.visibleColumn.column,
                activeColumnIndex: cell.visibleColumn.activeColumnIndex,
                altKey: event.altKey,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
                shiftKey: event.shiftKey,
            }
            this.eventBehavior.processColumnSortEvent(eventDetail);
        }
    }
}

export namespace ColumnSortingUiBehavior {
    export const typeName = 'columnsorting';
}
