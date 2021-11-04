
import { RenderedCell } from '../cell/rendered-cell';
import { Revgrid } from '../revgrid';
import { NumberTextfield } from './number-text-field';

/**
 * Functions well in Chrome, Safari, Firefox, and Internet Explorer.
 */

export class Number extends NumberTextfield {
    constructor(grid: Revgrid, renderedCell: RenderedCell) {
        super(grid, renderedCell);

        if (this.localizer === undefined) {
            this.localizer = grid.localization.numberFormatter;
        }
    }
}

export namespace Number {
    export const typeName = 'Number';
}
