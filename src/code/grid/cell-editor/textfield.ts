
import { RenderedCell } from '../cell/rendered-cell';
import { Revgrid } from '../revgrid';
import { NumberTextfield } from './number-text-field';

export class TextField extends NumberTextfield {
    constructor(grid: Revgrid, renderedCell: RenderedCell) {
        super(grid, renderedCell);

        if (this.localizer === undefined) {
            this.localizer = grid.localization.stringFormatter;
        }
    }
}

export namespace TextField {
    export const typeName = 'TextField';
}
