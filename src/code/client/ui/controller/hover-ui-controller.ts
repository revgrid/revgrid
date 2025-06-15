
import { RevPoint, RevSchemaField } from '../../../common';
import { RevLinedHoverCell } from '../../interfaces/lined-hover-cell';
import { RevViewCell } from '../../interfaces/view-cell';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../../settings/internal-api';
import { RevUiController } from './ui-controller';

/** @internal */
export class RevHoverUiController<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevUiController<BGS, BCS, SF> {

    readonly typeName = RevHoverUiController.typeName;

    override handlePointerMove(event: PointerEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        const canvasOffsetPoint: RevPoint = {
            x: event.offsetX,
            y: event.offsetY,
        };

        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        const viewCell = this.getViewCellFromHoverCell(hoverCell);
        this._mouse.setMouseCanvasOffset(canvasOffsetPoint, viewCell);

        if (RevGridSettings.isShowScrollerThumbOnMouseMoveModifierKeyDownInEvent(this._gridSettings, event)) {
            this._horizontalScroller.temporarilyGiveThumbFullVisibility(RevHoverUiController.temporaryThumbFullVisibilityTimePeriod);
            this._verticalScroller.temporarilyGiveThumbFullVisibility(RevHoverUiController.temporaryThumbFullVisibilityTimePeriod);
        }
        return super.handlePointerMove(event, hoverCell);
    }

    override handlePointerEnter(event: PointerEvent, hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        const canvasOffsetPoint: RevPoint = {
            x: event.offsetX,
            y: event.offsetY,
        };

        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        const viewCell = this.getViewCellFromHoverCell(hoverCell);
        this._mouse.setMouseCanvasOffset(canvasOffsetPoint, viewCell);
        return super.handlePointerEnter(event, hoverCell);
    }

    override handlePointerLeaveOut(event: PointerEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        this._mouse.setMouseCanvasOffset(undefined, undefined);
        return super.handlePointerLeaveOut(event, cell);
    }

    private getViewCellFromHoverCell(cell: RevLinedHoverCell<BCS, SF> | undefined): RevViewCell<BCS, SF> | undefined {
        if (cell === undefined) {
            return undefined;
        } else {
            if (RevLinedHoverCell.isMouseOverLine(cell)) {
                return undefined;
            } else {
                return cell.viewCell;
            }
        }
    }
}

/** @internal */
export namespace RevHoverUiController {
    export const typeName = 'hover';

    export const temporaryThumbFullVisibilityTimePeriod = 500; // milliseconds
}
