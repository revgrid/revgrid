import { Revgrid, ViewCell } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardCellEditor } from './standard-cell-editor';

export abstract class StandardInputEditor<BGS extends StandardBehavioredGridSettings, BCS extends StandardBehavioredColumnSettings> extends StandardCellEditor<BGS, BCS> {
    protected readonly inputElement: HTMLInputElement;

    constructor(grid: Revgrid<BGS, BCS>, inputType: string) {
        super(grid);

        const element = document.createElement('input') as HTMLInputElement;
        element.type = inputType;
        element.classList.add('revgrid-input-editor');
        this.inputElement = element;
    }

    override open(viewCell: ViewCell<BCS>) {
        super.open(viewCell)
        this.inputElement.style.textAlign = viewCell.columnSettings.horizontalAlign;
        this.inputElement.style.font = viewCell.columnSettings.font;
    }

    selectAll() {
        this.inputElement.setSelectionRange(0, this.inputElement.value.length);
    }

    // override getEditorValue(): unknown {
    //     return this.localizer.parse(this.input.value);
    // }

    // override getEditorValueOrError() {
    //     // This needs improvement
    //     const value = this.localizer.parse(this.input.value);
    //     const errorText: string | undefined = undefined;
    //     return { value, errorText };
    // }

    // override setEditorValue(value: unknown): void {
    //     this.input.value = this.localizer.format(value);
    // }
}

// const template = '<input type="text" lang="{{locale}}" class="hypergrid-textfield" style="{{style}}">';
