// import { CellEditor } from '../../cell-editor/cell-editor';
import { ColumnInterface } from '../../interfaces/column-interface';
import { CanvasEx } from '../canvas-ex/canvas-ex';
import { ViewCell } from '../cell/view-cell';
import { ViewLayout } from '../view/view-layout';

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

    export type Keyboard = CanvasEx.RevgridKeyboardEvent;

        // export interface EditorKeyboard extends Keyboard {
    //     readonly time: number;
    //     readonly editor: CellEditor,
    // }

    export interface Grid {
        readonly time: number;
    }

    export interface Scroll {
        readonly time: number;
        readonly value: number;
        readonly index: number;
        readonly offset: number;
    }

    export interface ChangedColumnsViewWidths extends ViewLayout.ChangedColumnsViewWidths{
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
}
