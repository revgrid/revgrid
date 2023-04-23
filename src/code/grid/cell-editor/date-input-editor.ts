import { ViewportCell } from '../cell/viewport-cell';
import { Revgrid } from '../revgrid';
import { InputEditor } from './input-editor';

export abstract class DateInputEditor extends InputEditor {
    constructor(grid: Revgrid, renderedCell: ViewportCell) {
        super(grid, renderedCell, 'date');
        this.input.classList.add('revgrid-date-input-editor');
    }
}
