
import { ViewportCell } from '../../cell/viewport-cell';
import { UiBehavior } from './ui-behavior';

/**
 * @constructor
 */
export class OnHoverUiBehavior extends UiBehavior {

    readonly typeName = OnHoverUiBehavior.typeName;

    override handleMouseMove(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewportCellFromMouseEvent(event);
        }
        this.mouse.setHoverCell(cell === null ? undefined : cell);
        return super.handleMouseMove(event, cell);
    }

    override handleMouseEnter(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewportCellFromMouseEvent(event);
        }
        this.mouse.setHoverCell(cell === null ? undefined : cell);
        return super.handleMouseEnter(event, cell);
    }

    override handleMouseExit(event: MouseEvent, cell: ViewportCell | null | undefined) {
        this.mouse.setHoverCell(undefined);
        return super.handleMouseExit(event, cell);
    }
}

export namespace OnHoverUiBehavior {
    export const typeName = 'onhover';
}
