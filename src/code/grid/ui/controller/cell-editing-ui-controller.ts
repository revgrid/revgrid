
// import { CellEditor } from '../../cell-editor/cell-editor';
import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { ViewCell } from '../../interfaces/data/view-cell';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { UiController } from './ui-controller';

// This file is no longer used.  Only kept to assist with development of CellEditor.  Will be deleted in future

export class CellEditingUiController<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> extends UiController<BGS, BCS, SF> {

    readonly typeName = CellEditingUiController.typeName;

    override handleClick(event: MouseEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (hoverCell === null) {
            hoverCell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (hoverCell !== undefined) {
            this.edit(hoverCell.viewCell, false);
        }
        return super.handleClick(event, hoverCell);
    }

    override handleDblClick(event: MouseEvent, cell: LinedHoverCell<BCS, SF> | null | undefined): LinedHoverCell<BCS, SF> | null | undefined {
        if (cell === null) {
            cell = this.tryGetHoverCellFromMouseEvent(event);
        }
        if (cell !== undefined) {
            this.edit(cell?.viewCell, true);
        }
        return super.handleDblClick(event, cell);
    }

    override handleKeyDown(event: KeyboardEvent, fromEditor: boolean) {
        // const cellEvent = this.focusScrollBehavior.getFocusedViewCell(false);
        // if (cellEvent === undefined) {
        //     super.handleKeyDown(event, fromEditor);
        // } else {
        //     // const keyboardEvent = eventDetail.primitiveEvent;
        //     const keyboardEvent = event;
        //     if (cellEvent.columnSettings.editOnKeyDown /*&& !grid.cellEditor*/) {
        //         const char = keyboardEvent.key;
        //         const isVisibleChar = char.length === 1 && !(keyboardEvent.metaKey || keyboardEvent.ctrlKey);
        //         const isDeleteChar = char === 'DELETE' || char === 'BACKSPACE';

        //         if (char === 'F2' || isVisibleChar || isDeleteChar) {
        //             // const editor = grid.onEditorActivate(cellEvent);

        //             // if (editor instanceof CellEditor) {
        //             //     if (isVisibleChar) {
        //             //         const element = editor.el;
        //             //         if (element instanceof HTMLInputElement) {
        //             //             element.value = char;
        //             //         }
        //             //     } else if (isDeleteChar) {
        //             //         editor.setEditorValue('');
        //             //     }
        //             //     keyboardEvent.preventDefault();
        //             // }
        //         } else {
        //             super.handleKeyDown(event, fromEditor);
        //         }
        //     } else {
        //         super.handleKeyDown(event, fromEditor);
        //     }
        // }
    }

    edit(cell: ViewCell<BCS, SF> | null, onDoubleClick: boolean) {
        if (
            // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
            cell !== null &&
            cell.isMain &&
            !(cell.columnSettings.editOnDoubleClick !== onDoubleClick) // both same (true or falsy)?
        ) {
            // this.grid.onEditorActivate(cell);
        }
    }
}

export namespace CellEditingUiController {
    export const typeName = 'cellediting';
}
