
import { Hypegrid } from '../grid/hypegrid';
import { NumberTextfield } from './number-text-field';

export class TextField extends NumberTextfield {
    constructor(grid: Hypegrid) {
        super(grid);

        if (this.localizer === undefined) {
            this.localizer = grid.localization.stringFormatter;
        }
    }
}

export namespace TextField {
    export const typeName = 'TextField';
}
