import { ViewportCell } from '../../cell/viewport-cell';
import { ColumnProperties } from '../../column/column-properties';
import { ColumnsManager } from '../../column/columns-manager';
import { EventDetail } from '../../event/event-detail';
import { UiBehavior } from './ui-behavior';

export class ColumnSortingUiBehavior extends UiBehavior {

    readonly typeName = ColumnSortingUiBehavior.typeName;

    private _columnsManager: ColumnsManager;

    override initializeOn() {
        this._columnsManager = this.grid.columnsManager;

        super.initializeOn();
    }

    override handleClick(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (!this.sharedState.mouseDownUpClickUsedForMoveOrResize) {
            if (cell === undefined) {
                cell = this.tryGetViewportCellFromMouseEvent(event);
            }
            if (cell !== null) {
                this.sort(event, cell, false);
            }
        }
        return super.handleClick(event, cell);
    }

    override handleDoubleClick(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewportCellFromMouseEvent(event);
        }
        if (cell !== null) {
            this.sort(event, cell, true);
        }
        return super.handleClick(event, cell);
    }

    override handleMouseMove(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewportCellFromMouseEvent(event);
        }
        if (cell !== null) {
            if (cell.isRowFixed && cell.isHeaderCell) {
                const columnProperties = this._columnsManager.getActiveColumnProperties(cell.visibleColumn.activeColumnIndex);
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

    private sort(event: MouseEvent, cell: ViewportCell, onDoubleClick: boolean) {
        let columnProperties: ColumnProperties;
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
            this.grid.fireSyntheticColumnSortEvent(eventDetail);
        }
    }
}

export namespace ColumnSortingUiBehavior {
    export const typeName = 'columnsorting';
}
