
// import { CellEditor } from '../../cell-editor/cell-editor';
import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { ViewCell } from '../../interfaces/data/view-cell';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { UiBehavior } from './ui-behavior';

export class CellEditingUiBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> extends UiBehavior<BGS, BCS, SF> {

    readonly typeName = CellEditingUiBehavior.typeName;

    override handleClick(event: MouseEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (hoverCell === undefined) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (hoverCell !== null) {
            this.edit(hoverCell.viewCell, false);
        }
        return super.handleClick(event, hoverCell);
    }

    override handleDblClick(event: MouseEvent, cell: LinedHoverCell<BCS, SF> | null | undefined): LinedHoverCell<BCS, SF> | null | undefined {
        if (cell === undefined) {
            cell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (cell !== null) {
            this.edit(cell?.viewCell, true);
        }
        return super.handleDblClick(event, cell);
    }

    override handleKeyDown(event: KeyboardEvent, fromEditor: boolean) {
        const cellEvent = this.focusScrollBehavior.getFocusedViewCell(false);
        if (cellEvent === undefined) {
            super.handleKeyDown(event, fromEditor);
        } else {
            // const keyboardEvent = eventDetail.primitiveEvent;
            const keyboardEvent = event;
            if (cellEvent.columnSettings.editOnKeyDown /*&& !grid.cellEditor*/) {
                const char = keyboardEvent.key;
                const isVisibleChar = char.length === 1 && !(keyboardEvent.metaKey || keyboardEvent.ctrlKey);
                const isDeleteChar = char === 'DELETE' || char === 'BACKSPACE';

                if (char === 'F2' || isVisibleChar || isDeleteChar) {
                    // const editor = grid.onEditorActivate(cellEvent);

                    // if (editor instanceof CellEditor) {
                    //     if (isVisibleChar) {
                    //         const element = editor.el;
                    //         if (element instanceof HTMLInputElement) {
                    //             element.value = char;
                    //         }
                    //     } else if (isDeleteChar) {
                    //         editor.setEditorValue('');
                    //     }
                    //     keyboardEvent.preventDefault();
                    // }
                } else {
                    super.handleKeyDown(event, fromEditor);
                }
            } else {
                super.handleKeyDown(event, fromEditor);
            }
        }
    }

    edit(cell: ViewCell<BCS, SF> | null, onDoubleClick: boolean) {
        if (
            cell !== null &&
            cell.isMain &&
            !(cell.columnSettings['editOnDoubleClick'] !== onDoubleClick) // both same (true or falsy)?
        ) {
            // this.grid.onEditorActivate(cell);
        }
    }
}

export namespace CellEditingUiBehavior {
    export const typeName = 'cellediting';
}
