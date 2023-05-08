import { ViewCell } from '../components/view/view-cell';
import { Revgrid } from '../revgrid';
import { InputEditor } from './input-editor';

export abstract class RangeInputEditor extends InputEditor {
    constructor(grid: Revgrid, renderedCell: ViewCell) {
        super(grid, renderedCell, 'range');
        this.input.classList.add('revgrid-range-input-editor');
    }
}
