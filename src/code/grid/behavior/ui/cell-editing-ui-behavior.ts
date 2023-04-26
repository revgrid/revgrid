
import { CellEditor } from '../../cell-editor/cell-editor';
import { ViewportCell } from '../../cell/viewport-cell';
import { EventDetail } from '../../event/event-detail';
import { UiBehavior } from './ui-behavior';

export class CellEditingUiBehavior extends UiBehavior {

    readonly typeName = CellEditingUiBehavior.typeName;

    override handleClick(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewportCellFromMouseEvent(event);
        }
        this.edit(cell, false);
        return super.handleClick(event, cell);
    }

    override handleDoubleClick(event: MouseEvent, cell: ViewportCell | null | undefined): ViewportCell | null | undefined {
        if (cell === undefined) {
            cell = this.tryGetViewportCellFromMouseEvent(event);
        }
        this.edit(cell, true);
        return super.handleDoubleClick(event, cell);
    }

    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        const grid = this.grid;

        const cellEvent = grid.getFocusedCellEvent(false);
        if (cellEvent === undefined) {
            super.handleKeyDown(eventDetail);
        } else {
            const keyboardEvent = eventDetail.primitiveEvent;
            if (cellEvent.columnProperties.editOnKeydown && !grid.cellEditor) {
                const char = keyboardEvent.key;
                const isVisibleChar = char.length === 1 && !(keyboardEvent.metaKey || keyboardEvent.ctrlKey);
                const isDeleteChar = char === 'DELETE' || char === 'BACKSPACE';

                if (char === 'F2' || isVisibleChar || isDeleteChar) {
                    const editor = grid.onEditorActivate(cellEvent);

                    if (editor instanceof CellEditor) {
                        if (isVisibleChar) {
                            const element = editor.el;
                            if (element instanceof HTMLInputElement) {
                                element.value = char;
                            }
                        } else if (isDeleteChar) {
                            editor.setEditorValue('');
                        }
                        eventDetail.primitiveEvent.preventDefault();
                    }
                } else {
                    super.handleKeyDown(eventDetail);
                }
            } else {
                super.handleKeyDown(eventDetail);
            }
        }
    }

    edit(cell: ViewportCell | null, onDoubleClick: boolean) {
        if (
            cell !== null &&
            cell.isDataCell &&
            !(cell.columnProperties['editOnDoubleClick'] !== onDoubleClick) // both same (true or falsy)?
        ) {
            this.grid.onEditorActivate(cell);
        }
    }
}

export namespace CellEditingUiBehavior {
    export const typeName = 'cellediting';
}
