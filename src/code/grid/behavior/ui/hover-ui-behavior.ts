
import { ViewCell } from '../../interfaces/data/view-cell';
import { Point } from '../../types-utils/point';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class HoverUiBehavior extends UiBehavior {

    readonly typeName = HoverUiBehavior.typeName;

    override handlePointerMove(event: PointerEvent, cell: ViewCell | null | undefined) {
        const canvasOffsetPoint: Point = {
            x: event.offsetX,
            y: event.offsetY,
        };

        if (cell === undefined) {
            cell = this.tryGetViewCellFromMouseEvent(event);
        }
        this.mouse.setMouseCanvasOffset(canvasOffsetPoint, cell === null ? undefined : cell);
        return super.handlePointerMove(event, cell);
    }

    override handlePointerEnter(event: PointerEvent, cell: ViewCell | null | undefined) {
        const canvasOffsetPoint: Point = {
            x: event.offsetX,
            y: event.offsetY,
        };

        if (cell === undefined) {
            cell = this.tryGetViewCellFromMouseEvent(event);
        }
        this.mouse.setMouseCanvasOffset(canvasOffsetPoint, cell === null ? undefined : cell);
        return super.handlePointerEnter(event, cell);
    }

    override handlePointerLeaveOut(event: PointerEvent, cell: ViewCell | null | undefined) {
        this.mouse.setMouseCanvasOffset(undefined, undefined);
        return super.handlePointerLeaveOut(event, cell);
    }
}

/** @internal */
export namespace HoverUiBehavior {
    export const typeName = 'hover';
}
