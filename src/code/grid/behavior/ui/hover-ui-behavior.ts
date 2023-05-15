
import { ViewCell } from '../../components/cell/view-cell';
import { UiBehavior } from './ui-behavior';

/** @internal */
export class HoverUiBehavior extends UiBehavior {

    readonly typeName = HoverUiBehavior.typeName;

    override handleMouseMove(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewCellFromMouseEvent(event);
        }
        this.mouse.setHoverCell(cell === null ? undefined : cell);
        return super.handleMouseMove(event, cell);
    }

    override handleMouseEnter(event: MouseEvent, cell: ViewCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewCellFromMouseEvent(event);
        }
        this.mouse.setHoverCell(cell === null ? undefined : cell);
        return super.handleMouseEnter(event, cell);
    }

    override handleMouseExit(event: MouseEvent, cell: ViewCell | null | undefined) {
        this.mouse.setHoverCell(undefined);
        return super.handleMouseExit(event, cell);
    }
}

/** @internal */
export namespace HoverUiBehavior {
    export const typeName = 'hover';
}
