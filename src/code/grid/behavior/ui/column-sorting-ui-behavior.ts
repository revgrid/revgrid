import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { ViewCell } from '../../interfaces/data/view-cell';
import { SchemaServer } from '../../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class ColumnSortingUiBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> extends UiBehavior<BGS, BCS, SF> {

    readonly typeName = ColumnSortingUiBehavior.typeName;

    override handleClick(event: MouseEvent, cell: LinedHoverCell<BCS, SF> | null | undefined) {
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

    override handleDblClick(event: MouseEvent, cell: LinedHoverCell<BCS, SF> | null | undefined) {
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

    override handlePointerMove(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        const sharedState = this.sharedState;
        if (sharedState.locationCursorName === undefined) {
            if (hoverCell === undefined) {
                hoverCell = this.tryGetHoverCellFromMouseEvent(event);
            }
            if (hoverCell !== null && LinedHoverCell.isMouseOverLine(hoverCell)) {
                const viewCell = hoverCell.viewCell;
                if (this.canSortWithCell(viewCell)) {
                    sharedState.locationCursorName = this.gridSettings.columnSortPossibleCursorName;
                    sharedState.locationTitleText = this.gridSettings.columnSortPossibleTitleText;
                }
            }
        }

        return super.handlePointerMove(event, hoverCell);
    }

    private checkSort(event: MouseEvent, hoverCell: LinedHoverCell<BCS, SF>, dblClick: boolean) {
        if (LinedHoverCell.isMouseOverLine(hoverCell)) {
            return false;
        } else {
            const viewCell = hoverCell.viewCell;
            if (this.canSortWithCell(viewCell) && viewCell.columnSettings.mouseSortOnDoubleClick === dblClick) {
                this.eventBehavior.processColumnSortEvent(event, viewCell);
                return true;
            } else {
                return false;
            }
        }
    }

    private canSortWithCell(cell: ViewCell<BCS, SF>): boolean {
        return (
            cell.isHeaderOrRowFixed &&
            cell.columnSettings.mouseSortable
        );
    }
}

/** @internal */
export namespace ColumnSortingUiBehavior {
    export const typeName = 'columnsorting';
}
