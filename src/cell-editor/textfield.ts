
import { Hypergrid } from '../grid/hypergrid';
import { NumberTextfield } from './number-text-field';

export class TextField extends NumberTextfield {
    constructor(grid: Hypergrid) {
        super(grid);

        if (this.localizer === undefined) {
            this.localizer = grid.localization.stringFormatter;
        }
    }
}

export namespace TextField {
    export const typeName = 'TextField';
}
