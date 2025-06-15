import { RevPoint, RevSchemaField } from '../../../common';
import { RevLinedHoverCell } from '../../interfaces/lined-hover-cell';
import { RevViewCell } from '../../interfaces/view-cell';
import { RevBehavioredColumnSettings } from '../../settings/internal-api';
import { RevScroller } from '../scroller/scroller';
import { RevViewLayout } from '../view/view-layout';

/** @public */
export namespace RevDispatchableEvent {
    export type Name<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = keyof Name.DetailMap<BCS, SF>;

    export namespace Name {
        export interface DetailMap<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
            'rev-column-sort': Detail.ColumnSort<BCS, SF>;
            'rev-cell-focus-changed': Detail.CellFocusChanged;
            'rev-row-focus-changed': Detail.RowFocusChanged;
            'rev-selection-changed': undefined;
            'rev-context-menu': Detail.Pointer<BCS, SF>;
            'rev-pointer-down': Detail.Pointer<BCS, SF>;
            'rev-pointer-up-cancel': Detail.Pointer<BCS, SF>;
            'rev-pointer-move': Detail.Pointer<BCS, SF>;
            'rev-pointer-enter': Detail.Pointer<BCS, SF>;
            'rev-pointer-leave-out': Detail.Pointer<BCS, SF>;
            'rev-wheel-move': Detail.Wheel<BCS, SF>;
            'rev-key-down': KeyboardEvent;
            'rev-key-up': KeyboardEvent;
            'rev-filter-applied': undefined;
            'rev-cell-enter': RevViewCell<BCS, SF>;
            'rev-cell-exit': RevViewCell<BCS, SF>;
            'rev-click': Detail.Pointer<BCS, SF>;
            'rev-dbl-click': Detail.Pointer<BCS, SF>;
            'rev-columns-view-widths-changed': RevViewLayout.ColumnsViewWidthChangeds;
            'rev-grid-rendered': undefined;
            'rev-grid-resized': undefined;
            'rev-touch-start': TouchEvent;
            'rev-touch-move': TouchEvent;
            'rev-touch-end': TouchEvent;
            'rev-horizontal-scroll-viewport-changed': undefined;
            'rev-vertical-scroll-viewport-changed': undefined;
            'rev-horizontal-scroller-action': RevScroller.Action;
            'rev-vertical-scroller-action': RevScroller.Action;
            'rev-field-column-list-changed': undefined;
        }

        export type MouseHoverCell =
            'rev-click' |
            'rev-dbl-click' |
            'rev-pointer-up-cancel' |
            'rev-pointer-down' |
            'rev-pointer-move' |
            'rev-pointer-enter' |
            'rev-pointer-leave-out' |
            'rev-wheel-move' |
            'rev-context-menu' |
            'rev-column-sort';
    }

    export namespace Detail {
        export interface CellFocusChanged {
            readonly oldPoint: RevPoint | undefined;
            readonly newPoint: RevPoint | undefined;
        }

        export interface RowFocusChanged {
            readonly oldSubgridRowIndex: number | undefined;
            readonly newSubgridRowIndex: number | undefined;
        }

        export interface Mouse<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends MouseEvent {
            revgridHoverCell?: RevLinedHoverCell<BCS, SF>;
        }

        export interface Pointer<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends PointerEvent, Mouse<BCS, SF> {
            revgridHoverCell?: RevLinedHoverCell<BCS, SF>;
        }

        export interface Wheel<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends WheelEvent {
            revgridHoverCell?: RevLinedHoverCell<BCS, SF>;
        }

        export interface ColumnSort<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends MouseEvent {
            revgridHoverCell?: RevLinedHoverCell<BCS, SF>;
        }
    }
}
