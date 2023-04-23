
import { ViewportCell } from '../cell/viewport-cell';
import { Revgrid } from '../revgrid';
import { TextInputEditor } from './text-input-editor';

export class TextField extends TextInputEditor {
    constructor(grid: Revgrid, renderedCell: ViewportCell) {
        super(grid, renderedCell);

        this.input.classList.add('revgrid-text-editor');

        if (this.localizer === undefined) {
            this.localizer = grid.localization.stringFormatter;
        }
    }
}

export namespace TextField {
    export const typeName = 'TextField';
}
