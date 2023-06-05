import { HoverCell } from '../../interfaces/data/hover-cell';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class ColumnSortingUiBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings> extends UiBehavior<BGS, BCS> {

    readonly typeName = ColumnSortingUiBehavior.typeName;

    override handleClick(event: MouseEvent, cell: HoverCell<BCS> | null | undefined) {
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

    override handleDblClick(event: MouseEvent, cell: HoverCell<BCS> | null | undefined) {
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

    override handlePointerMove(event: PointerEvent, cell: HoverCell<BCS> | null | undefined) {
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

    private checkSort(event: MouseEvent, cell: HoverCell<BCS>, dblClick: boolean) {
        if (this.canSortWithCell(cell) && cell.columnSettings.mouseSortOnDoubleClick === dblClick) {
            this.eventBehavior.processColumnSortEvent(event, cell);
            return true;
        } else {
            return false;
        }
    }

    private canSortWithCell(cell: HoverCell<BCS>): boolean {
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
