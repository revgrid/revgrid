import { Point } from '../../types-utils/point';
import { SchemaServer } from '../schema/schema-server';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { LinedHoverCell } from './hover-cell';

/** @public */
export namespace EventDetail {
    export interface Resize {
        readonly time: number;
        readonly width: number,
        readonly height: number,
    }

    export interface CellFocusChanged {
        readonly oldPoint: Point | undefined;
        readonly newPoint: Point | undefined;
    }

    export interface Mouse<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> extends MouseEvent {
        revgridHoverCell?: LinedHoverCell<BCS, SF>;
    }

    export interface Pointer<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> extends PointerEvent, Mouse<BCS, SF> {
        revgridHoverCell?: LinedHoverCell<BCS, SF>;
    }

    export interface Wheel<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> extends WheelEvent {
        revgridHoverCell?: LinedHoverCell<BCS, SF>;
    }

    export interface ColumnSort<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> extends MouseEvent {
        revgridHoverCell?: LinedHoverCell<BCS, SF>;
    }

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
        // Make sure values are all lower case so could be used in Drag Drop API
        LastRectangleSelectionAreaExtending = 'revgridlastrectangleselectionareaextending',
        LastColumnSelectionAreaExtending = 'revgridlastcolumnselectionareaextending',
        LastRowSelectionAreaExtending = 'revgridlastrowselectionareaextending',
        ColumnResizing = 'revgridcolumnresizing',
        ColumnMoving = 'revgridcolumnmoving',
    }

    export type DragType = keyof typeof DragTypeEnum;
}