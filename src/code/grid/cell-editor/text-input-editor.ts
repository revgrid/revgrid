import { ViewportCell } from '../cell/viewport-cell';
import { Revgrid } from '../revgrid';
import { InputEditor } from './input-editor';

export abstract class TextInputEditor extends InputEditor {
    constructor(grid: Revgrid, renderedCell: ViewportCell) {
        super(grid, renderedCell, 'text');
        this.input.classList.add('revgrid-text-input-editor');
    }
}
