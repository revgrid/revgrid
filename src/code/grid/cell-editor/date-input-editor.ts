import { ViewCell } from '../components/view/view-cell';
import { Revgrid } from '../revgrid';
import { InputEditor } from './input-editor';

export abstract class DateInputEditor extends InputEditor {
    constructor(grid: Revgrid, renderedCell: ViewCell) {
        super(grid, renderedCell, 'date');
        this.input.classList.add('revgrid-date-input-editor');
    }
}
