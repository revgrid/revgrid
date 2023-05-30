import { HoverCell } from '../../interfaces/data/hover-cell';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class ColumnSortingUiBehavior extends UiBehavior {

    readonly typeName = ColumnSortingUiBehavior.typeName;

    override handleClick(event: MouseEvent, cell: HoverCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (cell === null) {
            return super.handleClick(event, cell);
        } else {
            if (this.checkSort(event, cell, false)) {
                return cell;
            } else {
                return super.handleClick(event, cell);
            }
        }
    }

    override handleDblClick(event: MouseEvent, cell: HoverCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (cell === null) {
            return super.handleClick(event, cell);
        } else {
            if (this.checkSort(event, cell, true)) {
                return cell;
            } else {
                return super.handleClick(event, cell);
            }
        }
    }

    override handlePointerMove(event: PointerEvent, cell: HoverCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (cell !== null && this.canSortWithCell(cell)) {
            this.sharedState.locationCursorName = this.gridSettings.columnSortPossibleCursorName;
        }

        return super.handlePointerMove(event, cell);
    }

    private checkSort(event: MouseEvent, cell: HoverCell, dblClick: boolean) {
        if (this.canSortWithCell(cell) && cell.columnSettings.sortOnDoubleClick === dblClick) {
            this.eventBehavior.processColumnSortEvent(event, cell);
            return true;
        } else {
            return false;
        }
    }

    private canSortWithCell(cell: HoverCell): boolean {
        return (
            cell.isHeaderOrRowFixed &&
            !cell.isMouseOverLine() &&
            cell.columnSettings.sortable
        );
    }
}

/** @internal */
export namespace ColumnSortingUiBehavior {
    export const typeName = 'columnsorting';
}
