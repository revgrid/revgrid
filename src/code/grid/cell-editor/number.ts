
import { RenderedCell } from '../cell/rendered-cell';
import { Revgrid } from '../revgrid';
import { TextInputEditor } from './text-input-editor';

/**
 * Functions well in Chrome, Safari, Firefox, and Internet Explorer.
 */

export class Number extends TextInputEditor {
    constructor(grid: Revgrid, renderedCell: RenderedCell) {
        super(grid, renderedCell);

        this.input.classList.add('revgrid-number-editor');

        if (this.localizer === undefined) {
            this.localizer = grid.localization.numberFormatter;
        }
    }
}

export namespace Number {
    export const typeName = 'Number';
}
