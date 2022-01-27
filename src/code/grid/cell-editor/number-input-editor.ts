import { RenderedCell } from '../cell/rendered-cell';
import { Revgrid } from '../revgrid';
import { InputEditor } from './input-editor';

export abstract class NumberInputEditor extends InputEditor {
    constructor(grid: Revgrid, renderedCell: RenderedCell) {
        super(grid, renderedCell, 'number');
        this.input.classList.add('revgrid-number-input-editor');
    }
}
