import { DataServer, Rectangle, Revgrid, SchemaServer } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardCellEditor } from './standard-cell-editor';

export abstract class StandardInputEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SC extends SchemaServer.Column<BCS>
> extends StandardCellEditor<BGS, BCS, SC> {
    protected readonly inputElement: HTMLInputElement;

    constructor(grid: Revgrid<BGS, BCS, SC>, readonly: boolean, inputType: string) {
        super(grid, readonly);

        const element = document.createElement('input') as HTMLInputElement;
        element.type = inputType;
        element.style.position = 'absolute';
        element.style.borderStyle = 'none';
        element.style.padding = '0';
        element.classList.add('revgrid-input-editor');
        this.inputElement = element;
    }

    override open(_value: DataServer.DataValue) {
        this._grid.canvasManager.containerElement.appendChild(this.inputElement);
    }

    override close(_cancel: boolean) {
        this._grid.canvasManager.containerElement.removeChild(this.inputElement);
    }

    focus() {
        this.inputElement.focus({ preventScroll: true });
    }

    setBounds(bounds: Rectangle | undefined) {
        if (bounds === undefined) {
            this.inputElement.style.visibility = 'hidden';
        } else {
            this.inputElement.style.left = bounds.x + 'px';
            this.inputElement.style.top = bounds.y + 'px';
            this.inputElement.style.width = bounds.width + 'px';
            this.inputElement.style.height = bounds.height + 'px';
            this.inputElement.style.visibility = 'visible';
        }
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
