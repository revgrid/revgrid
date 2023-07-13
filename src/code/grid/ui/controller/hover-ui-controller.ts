
import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { ViewCell } from '../../interfaces/data/view-cell';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { Point } from '../../types-utils/point';
import { UiController } from './ui-controller';

/** @internal */
export class HoverUiController<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> extends UiController<BGS, BCS, SF> {

    readonly typeName = HoverUiController.typeName;

    override handlePointerMove(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        const canvasOffsetPoint: Point = {
            x: event.offsetX,
            y: event.offsetY,
        };

        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        const viewCell = this.getViewCellFromHoverCell(hoverCell);
        this.mouse.setMouseCanvasOffset(canvasOffsetPoint, viewCell);

        if (GridSettings.isShowScrollerThumbOnMouseMoveModifierKeyDownInEvent(this.gridSettings, event)) {
            this.horizontalScroller.temporarilyGiveThumbFullVisibility(HoverUiController.temporaryThumbFullVisibilityTimePeriod);
            this.verticalScroller.temporarilyGiveThumbFullVisibility(HoverUiController.temporaryThumbFullVisibilityTimePeriod);
        }
        return super.handlePointerMove(event, hoverCell);
    }

    override handlePointerEnter(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        const canvasOffsetPoint: Point = {
            x: event.offsetX,
            y: event.offsetY,
        };

        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        const viewCell = this.getViewCellFromHoverCell(hoverCell);
        this.mouse.setMouseCanvasOffset(canvasOffsetPoint, viewCell);
        return super.handlePointerEnter(event, hoverCell);
    }

    override handlePointerLeaveOut(event: PointerEvent, cell: LinedHoverCell<BCS, SF> | null | undefined) {
        this.mouse.setMouseCanvasOffset(undefined, undefined);
        return super.handlePointerLeaveOut(event, cell);
    }

    private getViewCellFromHoverCell(cell: LinedHoverCell<BCS, SF> | undefined): ViewCell<BCS, SF> | undefined {
        if (cell === undefined) {
            return undefined;
        } else {
            if (LinedHoverCell.isMouseOverLine(cell)) {
                return undefined;
            } else {
                return cell.viewCell;
            }
        }
    }
}

/** @internal */
export namespace HoverUiController {
    export const typeName = 'hover';

    export const temporaryThumbFullVisibilityTimePeriod = 500; // milliseconds
}
