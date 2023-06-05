
// import { CellEditor } from '../../cell-editor/cell-editor';
import { EventDetail } from '../../components/event/event-detail';
import { HoverCell } from '../../interfaces/data/hover-cell';
import { ViewCell } from '../../interfaces/data/view-cell';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { UiBehavior } from './ui-behavior';

export class CellEditingUiBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings> extends UiBehavior<BGS, BCS> {

    readonly typeName = CellEditingUiBehavior.typeName;

    override handleClick(event: MouseEvent, cell: HoverCell<BCS> | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetHoverCellFromMouseEvent(event);
        }
        this.edit(cell, false);
        return super.handleClick(event, cell);
    }

    override handleDblClick(event: MouseEvent, cell: HoverCell<BCS> | null | undefined): HoverCell<BCS> | null | undefined {
        if (cell === undefined) {
            cell = this.tryGetHoverCellFromMouseEvent(event);
        }
        this.edit(cell, true);
        return super.handleDblClick(event, cell);
    }

    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        const cellEvent = this.focusScrollBehavior.getFocusedViewCell(false);
        if (cellEvent === undefined) {
            super.handleKeyDown(eventDetail);
        } else {
            // const keyboardEvent = eventDetail.primitiveEvent;
            const keyboardEvent = eventDetail;
            if (cellEvent.columnSettings.editOnKeydown /*&& !grid.cellEditor*/) {
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
                    super.handleKeyDown(eventDetail);
                }
            } else {
                super.handleKeyDown(eventDetail);
            }
        }
    }

    edit(cell: ViewCell<BCS> | null, onDoubleClick: boolean) {
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
