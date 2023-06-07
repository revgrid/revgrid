
import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { ViewCell } from '../../interfaces/data/view-cell';
import { SchemaServer } from '../../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { Point } from '../../types-utils/point';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class HoverUiBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> extends UiBehavior<BGS, BCS, SC> {

    readonly typeName = HoverUiBehavior.typeName;

    override handlePointerMove(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SC> | null | undefined) {
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

    override handlePointerEnter(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SC> | null | undefined) {
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

    override handlePointerLeaveOut(event: PointerEvent, cell: LinedHoverCell<BCS, SC> | null | undefined) {
        this.mouse.setMouseCanvasOffset(undefined, undefined);
        return super.handlePointerLeaveOut(event, cell);
    }

    private getViewCellFromHoverCell(cell: LinedHoverCell<BCS, SC> | null): ViewCell<BCS, SC> | undefined {
        if (cell === null) {
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
export namespace HoverUiBehavior {
    export const typeName = 'hover';
}
