
import { CellEditor } from '../cell-editor/cell-editor';
import { MouseCellEvent } from '../cell/cell-event';
import { EventDetail } from '../event/event-detail';
import { Feature } from '../feature/feature';
export class CellEditingFeature extends Feature {

    readonly typeName = CellEditingFeature.typeName;

    override handleClick(event: MouseCellEvent) {
        this.edit(event, false);
    }

    override handleDoubleClick(event: MouseCellEvent) {
        this.edit(event, true);
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

    edit(event: MouseCellEvent, onDoubleClick: boolean) {
        if (
            event.isDataCell &&
            !(event.columnProperties['editOnDoubleClick'] !== onDoubleClick) // both same (true or falsy)?
        ) {
            this.grid.onEditorActivate(event);
        }

        if (this.next) {
            this.next[onDoubleClick ? 'handleDoubleClick' : 'handleClick'](event);
        }
    }
}

export namespace CellEditingFeature {
    export const typeName = 'cellediting';
}
