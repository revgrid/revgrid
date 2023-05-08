import { ViewCell } from '../components/cell/view-cell';
import { Revgrid } from '../revgrid';
import { InputEditor } from './input-editor';

export abstract class TextInputEditor extends InputEditor {
    constructor(grid: Revgrid, renderedCell: ViewCell) {
        super(grid, renderedCell, 'text');
        this.input.classList.add('revgrid-text-input-editor');
    }
}
