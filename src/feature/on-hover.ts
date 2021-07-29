
import { Hypergrid } from '../grid/hypergrid';
import { CellEvent } from '../lib/cell-event';
import { Feature } from './feature';

/**
 * @constructor
 */
export class OnHover extends Feature {

    readonly typeName = OnHover.typeName;

    override handleMouseMove(grid: Hypergrid, event: CellEvent | undefined) {
        grid.processHoverCell(event);
        super.handleMouseMove(grid, event);
    }

    override handleMouseEnter(grid: Hypergrid, event: CellEvent) {
        grid.processHoverCell(event);
        super.handleMouseEnter(grid, event);
    }

    override handleMouseExit(grid: Hypergrid, event: CellEvent) {
        grid.processHoverCell(undefined);
        super.handleMouseExit(grid, event);
    }
}

export namespace OnHover {
    export const typeName = 'onhover';
}
