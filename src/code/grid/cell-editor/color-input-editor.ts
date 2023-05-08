import { ViewCell } from '../components/cell/view-cell';
import { Revgrid } from '../revgrid';
import { InputEditor } from './input-editor';

export abstract class ColorInputEditor extends InputEditor {
    constructor(grid: Revgrid, renderedCell: ViewCell) {
        super(grid, renderedCell, 'color');
        this.input.classList.add('revgrid-color-input-editor');
    }
}
