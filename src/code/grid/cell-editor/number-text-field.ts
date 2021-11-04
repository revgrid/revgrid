import { RenderedCell } from '../cell/rendered-cell';
import { Revgrid } from '../revgrid';
import { CellEditor } from './cell-editor';

export abstract class NumberTextfield extends CellEditor {
    private readonly input: HTMLInputElement;

    constructor(grid: Revgrid, renderedCell: RenderedCell) {
        const element = document.createElement('input') as HTMLInputElement;
        element.type = 'text';
        element.classList.add('hypergrid-textfield');
        element.style.textAlign = renderedCell.columnProperties.halign;
        element.style.font = renderedCell.columnProperties.font;

        super(grid, renderedCell, element);

        this.input = element;
    }

    override selectAll() {
        this.input.setSelectionRange(0, this.input.value.length);
    }
}

// const template = '<input type="text" lang="{{locale}}" class="hypergrid-textfield" style="{{style}}">';
