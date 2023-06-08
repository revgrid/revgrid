import { CellEditor, DataServer, Focus, Revgrid, SchemaServer } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardElementCellEditor } from './standard-element-cell-editor';

export abstract class StandardInputElementEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SC extends SchemaServer.Column<BCS>
> extends StandardElementCellEditor<BGS, BCS, SC> {
    keyDownEventer: CellEditor.KeyDownEventer;

    declare protected readonly element: HTMLInputElement;

    constructor(grid: Revgrid<BGS, BCS, SC>, readonly: boolean, inputType: string) {
        const element = document.createElement('input') as HTMLInputElement;
        super(grid, readonly, element);

        element.type = inputType;
        element.style.borderStyle = 'none';
        element.style.padding = '0';
        element.classList.add('revgrid-input-editor');
    }

    override open(value: DataServer.ViewValue, valueIsNew: boolean) {
        super.open(value, valueIsNew);
        this.element.addEventListener('keydown', this.keyDownEventer);
    }

    override close(cancel: boolean) {
        this.element.removeEventListener('keydown', this.keyDownEventer);
        super.close(cancel);
    }

    override consumeKeyDownEvent(event: KeyboardEvent) {
        this.element.dispatchEvent(event);
    }

    override checkConsumeKeyDownEvent(event: KeyboardEvent, fromEditor: boolean) {
        if (fromEditor) {
            // Event was emitted by this editor.  Any key it can consume has effectively already been consumed
            return this.canConsumeKey(event.key);
        } else {
            if (this.canConsumeKey(event.key)) {
                this.consumeKeyDownEvent(event);
                return true;
            } else {
                return false;
            }
        }
    }

    selectAll() {
        this.element.setSelectionRange(0, this.element.value.length);
    }

    private canConsumeKey(key: string) {
        switch (key) {
            case Focus.ActionKeyboardKey.ArrowUp:
            case Focus.ActionKeyboardKey.ArrowDown:
            case Focus.ActionKeyboardKey.PageUp:
            case Focus.ActionKeyboardKey.PageDown:
            case Focus.ActionKeyboardKey.Tab:
            case Focus.ActionKeyboardKey.Enter:
            case Focus.ActionKeyboardKey.Escape:
                return false;
            default:
                return true;
        }
    }
}
