
import { HoverCell } from '../../interfaces/data/hover-cell';
import { ViewCell } from '../../interfaces/data/view-cell';
import { MergableColumnSettings } from '../../interfaces/settings/mergable-column-settings';
import { MergableGridSettings } from '../../interfaces/settings/mergable-grid-settings';
import { Point } from '../../types-utils/point';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class HoverUiBehavior<MGS extends MergableGridSettings, MCS extends MergableColumnSettings> extends UiBehavior<MGS, MCS> {

    readonly typeName = HoverUiBehavior.typeName;

    override handlePointerMove(event: PointerEvent, hoverCell: HoverCell<MCS> | null | undefined) {
        const canvasOffsetPoint: Point = {
            x: event.offsetX,
            y: event.offsetY,
        };

        if (hoverCell === undefined) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        const viewCell = this.getViewCellFromHoverCell(hoverCell);
        this.mouse.setMouseCanvasOffset(canvasOffsetPoint, viewCell);
        return super.handlePointerMove(event, hoverCell);
    }

    override handlePointerEnter(event: PointerEvent, hoverCell: HoverCell<MCS> | null | undefined) {
        const canvasOffsetPoint: Point = {
            x: event.offsetX,
            y: event.offsetY,
        };

        if (hoverCell === undefined) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        const viewCell = this.getViewCellFromHoverCell(hoverCell);
        this.mouse.setMouseCanvasOffset(canvasOffsetPoint, viewCell);
        return super.handlePointerEnter(event, hoverCell);
    }

    override handlePointerLeaveOut(event: PointerEvent, cell: HoverCell<MCS> | null | undefined) {
        this.mouse.setMouseCanvasOffset(undefined, undefined);
        return super.handlePointerLeaveOut(event, cell);
    }

    private getViewCellFromHoverCell(cell: HoverCell<MCS> | null): ViewCell<MCS> | undefined {
        if (cell === null) {
            return undefined;
        } else {
            if (cell.isMouseOverLine()) {
                return undefined;
            } else {
                return cell;
            }
        }
    }
}

/** @internal */
export namespace HoverUiBehavior {
    export const typeName = 'hover';
}
