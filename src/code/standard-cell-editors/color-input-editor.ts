import { Revgrid, ViewCell } from '../grid/grid-public-api';
import { InputEditor } from './input-editor';

export abstract class ColorInputEditor extends InputEditor {
    constructor(grid: Revgrid, renderedCell: ViewCell) {
        super(grid, renderedCell, 'color');
        this.input.classList.add('revgrid-color-input-editor');
    }
}
