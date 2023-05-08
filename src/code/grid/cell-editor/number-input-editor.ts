import { ViewCell } from '../components/cell/view-cell';
import { Revgrid } from '../revgrid';
import { InputEditor } from './input-editor';

export abstract class NumberInputEditor extends InputEditor {
    constructor(grid: Revgrid, renderedCell: ViewCell) {
        super(grid, renderedCell, 'number');
        this.input.classList.add('revgrid-number-input-editor');
    }
}
