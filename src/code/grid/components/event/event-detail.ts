// import { CellEditor } from '../../cell-editor/cell-editor';
import { ColumnInterface } from '../../interfaces/column-interface';
import { CanvasManager } from '../canvas/canvas-manager';
import { ViewCell } from '../cell/view-cell';

/** @public */
export namespace EventDetail {
    export interface Resize {
        readonly time: number;
        readonly width: number,
        readonly height: number,
    }

    export interface Mouse extends MouseEvent {
        revgridViewCell?: ViewCell;
    }

    export interface Wheel extends WheelEvent {
        revgridViewCell?: ViewCell;
    }

    export type Keyboard = CanvasManager.RevgridKeyboardEvent;

        // export interface EditorKeyboard extends Keyboard {
    //     readonly time: number;
    //     readonly editor: CellEditor,
    // }

    export interface Grid {
        readonly time: number;
    }

    export interface ScrollerAction {
        readonly type: ScrollerAction.Type;
        readonly viewportStart: number | undefined;
    }

    export namespace ScrollerAction {
        export const enum Type {
            StepForward,
            StepBack,
            PageForward,
            PageBack,
            newViewportStart,
        }
    }

    export interface ColumnSort {
        readonly time: number;
        readonly column: ColumnInterface;
        readonly activeColumnIndex: number;
        readonly altKey: boolean;
        readonly metaKey: boolean;
        readonly ctrlKey: boolean;
        readonly shiftKey: boolean;
    }

    export interface RowsDataInvalidated {
        readonly time: number;
        readonly rowIndex: number;
        readonly count: number;
    }

    export interface CellDataInvalidated {
        readonly time: number;
        readonly schemaColumnIndex: number;
        readonly rowIndex: number;
    }

    export interface RowCellsDataInvalidated {
        readonly time: number;
        readonly rowIndex: number;
        readonly schemaColumnIndexes: number[];
    }

    export interface RowColumnsDataInvalidated {
        readonly time: number;
        readonly rowIndex: number;
        readonly schemaColumnIndex: number;
        readonly columnCount: number;
    }

    export const enum DragTypeEnum {
        ExtendLastRectangleSelectionArea = 'RevgridExtendLastRectangleSelectionArea',
        ExtendLastColumnSelectionArea = 'RevgridExtendLastColumnSelectionArea',
        ExtendLastRowSelectionArea = 'RevgridExtendLastRowSelectionArea',
    }

    export type DragType = keyof typeof DragTypeEnum;
}
