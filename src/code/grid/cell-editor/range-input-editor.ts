import { ViewportCell } from '../cell/viewport-cell';
import { Revgrid } from '../revgrid';
import { InputEditor } from './input-editor';

export abstract class RangeInputEditor extends InputEditor {
    constructor(grid: Revgrid, renderedCell: ViewportCell) {
        super(grid, renderedCell, 'range');
        this.input.classList.add('revgrid-range-input-editor');
    }
}
