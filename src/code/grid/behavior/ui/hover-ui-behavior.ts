
import { ViewCell } from '../../components/cell/view-cell';
import { Point } from '../../lib/point';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class HoverUiBehavior extends UiBehavior {

    readonly typeName = HoverUiBehavior.typeName;

    override handleMouseMove(event: MouseEvent, cell: ViewCell | null | undefined) {
        const canvasOffsetPoint: Point = {
            x: event.offsetX,
            y: event.offsetY,
        };

        if (cell === undefined) {
            cell = this.tryGetViewCellFromMouseEvent(event);
        }
        this.mouse.setMouseCanvasOffset(canvasOffsetPoint, cell === null ? undefined : cell);
        return super.handleMouseMove(event, cell);
    }

    override handleMouseEnter(event: MouseEvent, cell: ViewCell | null | undefined) {
        const canvasOffsetPoint: Point = {
            x: event.offsetX,
            y: event.offsetY,
        };

        if (cell === undefined) {
            cell = this.tryGetViewCellFromMouseEvent(event);
        }
        this.mouse.setMouseCanvasOffset(canvasOffsetPoint, cell === null ? undefined : cell);
        return super.handleMouseEnter(event, cell);
    }

    override handleMouseExit(event: MouseEvent, cell: ViewCell | null | undefined) {
        this.mouse.setMouseCanvasOffset(undefined, undefined);
        return super.handleMouseExit(event, cell);
    }
}

/** @internal */
export namespace HoverUiBehavior {
    export const typeName = 'hover';
}
