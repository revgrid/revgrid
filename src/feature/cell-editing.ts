
import { CellEditor } from '../cell-editor/cell-editor';
import { Hypergrid } from '../grid/hypergrid';
import { Canvas } from '../lib/canvas';
import { CellEvent } from '../lib/cell-event';
import { Feature } from './feature';
export class CellEditingFeature extends Feature {

    readonly typeName = CellEditingFeature.typeName;

    override handleClick(grid: Hypergrid, event: CellEvent) {
        this.edit(grid, event, false);
    }

    override handleDoubleClick(grid: Hypergrid, event: CellEvent) {
        this.edit(grid, event, true);
    }

    /**
     * @memberOf KeyPaging.prototype ????
     */
    override handleKeyDown(grid: Hypergrid, event: Canvas.KeyboardSyntheticEvent) {
        let char: string;
        let isVisibleChar: boolean;
        let isDeleteChar: boolean;

        const cellEvent = grid.getGridCellFromLastSelection(false);
        if (
            (cellEvent !== undefined) &&
            cellEvent.columnProperties.editOnKeydown &&
            !grid.cellEditor &&
            (
                (char = event.detail.char) === 'F2' ||
                (isVisibleChar = char.length === 1 && !(event.detail.meta || event.detail.ctrl)) ||
                (isDeleteChar = char === 'DELETE' || char === 'BACKSPACE')
            )
        ) {
            const editor = grid.onEditorActivate(cellEvent);

            if (editor instanceof CellEditor) {
                if (isVisibleChar) {
                    editor.input.value = char;
                } else if (isDeleteChar) {
                    editor.setEditorValue('');
                }
                event.detail.primitiveEvent.preventDefault();
            }
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    }

    edit(grid: Hypergrid, event: CellEvent, onDoubleClick: boolean) {
        if (
            event.isDataCell &&
            !(event.columnProperties['editOnDoubleClick'] != onDoubleClick) // both same (true or falsy)?
        ) {
            grid.onEditorActivate(event);
        }

        if (this.next) {
            this.next[onDoubleClick ? 'handleDoubleClick' : 'handleClick'](grid, event);
        }
    }
}

export namespace CellEditingFeature {
    export const typeName = 'cellediting';
}
