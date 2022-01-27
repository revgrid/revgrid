import { RenderedCell } from '../cell/rendered-cell';
import { Revgrid } from '../revgrid';
import { InputEditor } from './input-editor';

export abstract class ColorInputEditor extends InputEditor {
    constructor(grid: Revgrid, renderedCell: RenderedCell) {
        super(grid, renderedCell, 'color');
        this.input.classList.add('revgrid-color-input-editor');
    }
}
