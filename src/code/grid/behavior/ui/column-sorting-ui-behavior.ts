import { HoverCell } from '../../interfaces/data/hover-cell';
import { MergableColumnSettings } from '../../interfaces/settings/mergable-column-settings';
import { MergableGridSettings } from '../../interfaces/settings/mergable-grid-settings';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class ColumnSortingUiBehavior<MGS extends MergableGridSettings, MCS extends MergableColumnSettings> extends UiBehavior<MGS, MCS> {

    readonly typeName = ColumnSortingUiBehavior.typeName;

    override handleClick(event: MouseEvent, cell: HoverCell<MCS> | null | undefined) {
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

    override handleDblClick(event: MouseEvent, cell: HoverCell<MCS> | null | undefined) {
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

    override handlePointerMove(event: PointerEvent, cell: HoverCell<MCS> | null | undefined) {
        const sharedState = this.sharedState;
        if (sharedState.locationCursorName === undefined) {
            if (cell === undefined) {
                cell = this.tryGetHoverCellFromMouseEvent(event);
            }
            if (cell !== null && this.canSortWithCell(cell)) {
                sharedState.locationCursorName = this.gridSettings.columnSortPossibleCursorName;
            }
        }

        return super.handlePointerMove(event, cell);
    }

    private checkSort(event: MouseEvent, cell: HoverCell<MCS>, dblClick: boolean) {
        if (this.canSortWithCell(cell) && cell.columnSettings.mouseSortOnDoubleClick === dblClick) {
            this.eventBehavior.processColumnSortEvent(event, cell);
            return true;
        } else {
            return false;
        }
    }

    private canSortWithCell(cell: HoverCell<MCS>): boolean {
        return (
            cell.isHeaderOrRowFixed &&
            !cell.isMouseOverLine() &&
            cell.columnSettings.mouseSortable
        );
    }
}

/** @internal */
export namespace ColumnSortingUiBehavior {
    export const typeName = 'columnsorting';
}
