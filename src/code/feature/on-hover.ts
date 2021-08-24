
import { Hypegrid } from '../grid/hypegrid';
import { CellEvent } from '../renderer/cell-event';
import { Feature } from './feature';

/**
 * @constructor
 */
export class OnHover extends Feature {

    readonly typeName = OnHover.typeName;

    override handleMouseMove(grid: Hypegrid, event: CellEvent | undefined) {
        grid.processHoverCell(event);
        super.handleMouseMove(grid, event);
    }

    override handleMouseEnter(grid: Hypegrid, event: CellEvent) {
        grid.processHoverCell(event);
        super.handleMouseEnter(grid, event);
    }

    override handleMouseExit(grid: Hypegrid, event: CellEvent) {
        grid.processHoverCell(undefined);
        super.handleMouseExit(grid, event);
    }
}

export namespace OnHover {
    export const typeName = 'onhover';
}
