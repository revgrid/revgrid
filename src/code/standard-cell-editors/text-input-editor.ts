import { Revgrid, ViewCell } from '../grid/grid-public-api';
import { InputEditor } from './input-editor';

export abstract class TextInputEditor extends InputEditor {
    constructor(grid: Revgrid, renderedCell: ViewCell) {
        super(grid, renderedCell, 'text');
        this.input.classList.add('revgrid-text-input-editor');
    }
}
