import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevCellEditor, RevClientGrid, RevDataServer, RevFocus, RevSchemaField, RevViewCell } from '../../client/internal-api';
import { RevStandardElementCellEditor } from './standard-element-cell-editor';

/** @public */
export abstract class RevStandardInputElementCellEditor<
    BGS extends RevBehavioredGridSettings,
    BCS extends RevBehavioredColumnSettings,
    SF extends RevSchemaField
> extends RevStandardElementCellEditor<BGS, BCS, SF> {
    keyDownEventer: RevCellEditor.KeyDownEventer;

    declare protected readonly element: HTMLInputElement;

    constructor(grid: RevClientGrid<BGS, BCS, SF>, dataServer: RevDataServer<SF>, inputType: string) {
        const element = document.createElement('input');
        super(grid, dataServer, element);

        element.type = inputType;
        element.style.borderStyle = 'none';
        element.style.padding = '0';
        element.classList.add('revgrid-input-editor');
    }

    override setReadonly(value: boolean) {
        super.setReadonly(value);
        this.element.readOnly = value;
    }

    override tryOpenCell(viewCell: RevViewCell<BCS, SF>, openingKeyDownEvent: KeyboardEvent | undefined, openingClickEvent: MouseEvent | undefined) {
        const result = super.tryOpenCell(viewCell, openingKeyDownEvent, openingClickEvent);
        if (result) {
            this.element.addEventListener('keydown', this.keyDownEventer);
        }
        return result;
    }

    override closeCell(field: SF, subgridRowIndex: number, cancel: boolean) {
        this.element.removeEventListener('keydown', this.keyDownEventer);
        super.closeCell(field, subgridRowIndex, cancel);
    }

    override processGridKeyDownEvent(event: KeyboardEvent, fromEditor: boolean, _schemaColumn: SF, _subgridRowIndex: number) {
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
        switch (key as RevFocus.ActionKeyboardKey) {
            case RevFocus.ActionKeyboardKey.arrowUp:
            case RevFocus.ActionKeyboardKey.arrowDown:
            case RevFocus.ActionKeyboardKey.pageUp:
            case RevFocus.ActionKeyboardKey.pageDown:
            case RevFocus.ActionKeyboardKey.tab:
            case RevFocus.ActionKeyboardKey.enter:
            case RevFocus.ActionKeyboardKey.escape:
                return false;
            default:
                return true;
        }
    }
}
