import { CellEditor, DataServer, DatalessViewCell, Focus, Revgrid, SchemaServer } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardElementCellEditor } from './standard-element-cell-editor';

export abstract class StandardInputElementCellEditor<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SF extends SchemaServer.Field
> extends StandardElementCellEditor<BGS, BCS, SF> {
    keyDownEventer: CellEditor.KeyDownEventer;

    declare protected readonly element: HTMLInputElement;

    constructor(grid: Revgrid<BGS, BCS, SF>, dataServer: DataServer<SF>, inputType: string) {
        const element = document.createElement('input') as HTMLInputElement;
        super(grid, dataServer, element);

        element.type = inputType;
        element.style.borderStyle = 'none';
        element.style.padding = '0';
        element.classList.add('revgrid-input-editor');
    }

    override set readonly(value: boolean) {
        super.readonly = value;
        this.element.readOnly = value;
    }

    override tryOpen(viewCell: DatalessViewCell<BCS, SF>, openingKeyDownEvent: KeyboardEvent | undefined, openingClickEvent: MouseEvent | undefined) {
        const result = super.tryOpen(viewCell, openingKeyDownEvent, openingClickEvent);
        if (result) {
            this.element.addEventListener('keydown', this.keyDownEventer);
        }
        return result;
    }

    override close(field: SF, subgridRowIndex: number, cancel: boolean) {
        this.element.removeEventListener('keydown', this.keyDownEventer);
        super.close(field, subgridRowIndex, cancel);
    }

    override processKeyDownEvent(event: KeyboardEvent, fromEditor: boolean, _schemaColumn: SF, _subgridRowIndex: number) {
        if (fromEditor) {
            // Event was emitted by this editor.  Any key it can consume has effectively already been consumed
            return this.canConsumeKey(event.key);
        } else {
            // Cannot dispatch an event from another element to an input element
            return false;
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
