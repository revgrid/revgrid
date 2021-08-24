
import { Hypegrid } from '../grid/hypegrid';
import { NumberTextfield } from './number-text-field';

/**
 * Functions well in Chrome, Safari, Firefox, and Internet Explorer.
 */

export class Number extends NumberTextfield {
    constructor(grid: Hypegrid) {
        super(grid);

        if (this.localizer === undefined) {
            this.localizer = grid.localization.numberFormatter;
        }
    }
}

export namespace Number {
    export const typeName = 'Number';
}
