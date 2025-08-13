import { RevSchemaField } from '../../../common';
import { RevMouse } from '../../components/mouse/mouse';
import { RevLinedHoverCell } from '../../interfaces/lined-hover-cell';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../../settings';
import { RevUiController } from './ui-controller';

/** @internal */
export class RevColumnSortingUiController<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevUiController<BGS, BCS, SF> {

    readonly typeName = RevColumnSortingUiController.typeName;

    override handleClick(event: MouseEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined) {
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

    override handleDblClick(event: MouseEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined) {
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

    override handlePointerMove(event: PointerEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        const sharedState = this._sharedState;
        if (sharedState.mouseActionPossible === undefined) {
            if (hoverCell === null) {
                hoverCell = this.tryGetHoverCellFromMouseEvent(event);
            }
            if (hoverCell !== undefined && RevLinedHoverCell.isMouseOverLine(hoverCell)) {
                const viewCell = hoverCell.viewCell;
                if (viewCell.isHeaderOrRowFixed) {
                    const columnSettings = viewCell.columnSettings;
                    if (columnSettings.sortOnClick || columnSettings.sortOnDoubleClick) {
                        sharedState.mouseActionPossible = RevMouse.ActionPossible.columnSort;
                    }
                }
            }
        }

        return super.handlePointerMove(event, hoverCell);
    }

    private checkSort(event: MouseEvent, hoverCell: RevLinedHoverCell<BCS, SF>, dblClick: boolean) {
        if (RevLinedHoverCell.isMouseOverLine(hoverCell)) {
            return false;
        } else {
            const viewCell = hoverCell.viewCell;
            const columnSettings = viewCell.columnSettings;
            if (
                viewCell.isHeaderOrRowFixed &&
                (dblClick ? columnSettings.sortOnDoubleClick : columnSettings.sortOnClick)
            ) {
                this._eventBehavior.processColumnSortEvent(event, viewCell);
                return true;
            } else {
                return false;
            }
        }
    }
}

/** @internal */
export namespace RevColumnSortingUiController {
    export const typeName = 'columnsorting';
}
