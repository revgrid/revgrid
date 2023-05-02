import { CellEditor } from '../cell-editor/cell-editor';
import { ViewportCell } from '../cell/viewport-cell';
import { ColumnInterface } from '../common/column-interface';
import { Revgrid } from '../revgrid';

/** @public */
export namespace EventDetail {
    export interface Resize {
        readonly time: number;
        readonly width: number,
        readonly height: number,
    }

    export interface Mouse extends MouseEvent {
        revgridViewportCell?: ViewportCell;
    }

    export interface Wheel extends WheelEvent {
        revgridViewportCell?: ViewportCell;
    }

    export interface Keyboard extends KeyboardEvent {
        readonly revgrid_nowTime: number;
        readonly revgrid_repeatCount: number;
        readonly revgrid_repeatStartTime: number;
        readonly revgrid_navigateKey: Keyboard.NavigateKey | undefined;
    }

    export namespace Keyboard {
        export const enum NavigateKey {
            left,
            right,
            up,
            down,
            pageUp,
            pageDown,
            home,
            end,
        }
    }

    export interface EditorKeyboard extends Keyboard {
        readonly time: number;
        readonly grid: Revgrid,
        readonly editor: CellEditor,
    }

    export interface Grid {
        readonly time: number;
        readonly source: Revgrid;
    }

    export interface Scroll {
        readonly time: number;
        readonly value: number;
        readonly index: number;
        readonly offset: number;
    }

    export interface ColumnsViewWidthsChanged {
        readonly fixedChanged: boolean
        readonly scrollableChanged: boolean;
        readonly visibleChanged: boolean;
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
