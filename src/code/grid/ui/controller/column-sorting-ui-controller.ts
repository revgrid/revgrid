import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { UiController } from './ui-controller';

/** @internal */
export class ColumnSortingUiController<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> extends UiController<BGS, BCS, SF> {

    readonly typeName = ColumnSortingUiController.typeName;

    override handleClick(event: MouseEvent, cell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (cell === null) {
            cell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (cell === undefined) {
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
        if (cell === null) {
            cell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (cell === undefined) {
            return super.handleDblClick(event, cell);
        } else {
            if (this.checkSort(event, cell, true)) {
                return cell;
            } else {
                return super.handleDblClick(event, cell);
            }
        }
    }

    override handlePointerMove(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        const sharedState = this.sharedState;
        if (sharedState.locationCursorName === undefined) {
            if (hoverCell === null) {
                hoverCell = this.tryGetHoverCellFromMouseEvent(event);
            }
            if (hoverCell !== undefined && LinedHoverCell.isMouseOverLine(hoverCell)) {
                const viewCell = hoverCell.viewCell;
                if (viewCell.isHeaderOrRowFixed) {
                    const columnSettings = viewCell.columnSettings;
                    if (columnSettings.sortOnClick || columnSettings.sortOnDoubleClick) {
                        sharedState.locationCursorName = this.gridSettings.columnSortPossibleCursorName;
                        sharedState.locationTitleText = this.gridSettings.columnSortPossibleTitleText;
                    }
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
            const columnSettings = viewCell.columnSettings;
            if (
                viewCell.isHeaderOrRowFixed &&
                (dblClick ? columnSettings.sortOnDoubleClick : columnSettings.sortOnClick)
            ) {
                this.eventBehavior.processColumnSortEvent(event, viewCell);
                return true;
            } else {
                return false;
            }
        }
    }
}

/** @internal */
export namespace ColumnSortingUiController {
    export const typeName = 'columnsorting';
}
