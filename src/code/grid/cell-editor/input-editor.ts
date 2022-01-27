import { RenderedCell } from '../cell/rendered-cell';
import { Revgrid } from '../revgrid';
import { CellEditor } from './cell-editor';

export abstract class InputEditor extends CellEditor {
    protected readonly input: HTMLInputElement;

    constructor(grid: Revgrid, renderedCell: RenderedCell, inputType: string) {
        const element = document.createElement('input') as HTMLInputElement;
        element.type = inputType;
        element.classList.add('revgrid-input-editor');
        element.style.textAlign = renderedCell.columnProperties.halign;
        element.style.font = renderedCell.columnProperties.font;

        super(grid, renderedCell, element);

        this.input = element;
    }

    override selectAll() {
        this.input.setSelectionRange(0, this.input.value.length);
    }

    override getEditorValue(): unknown {
        return this.localizer.parse(this.input.value);
    }

    override getEditorValueOrError() {
        // This needs improvement
        const value = this.localizer.parse(this.input.value);
        const errorText = undefined;
        return { value, errorText };
    }

    override setEditorValue(value: unknown): void {
        this.input.value = this.localizer.format(value);
    }
}

// const template = '<input type="text" lang="{{locale}}" class="hypergrid-textfield" style="{{style}}">';
