import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { ViewCell } from '../../interfaces/data/view-cell';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { Point } from '../../types-utils/point';
import { Scroller } from '../scroller/scroller';
import { ViewLayout } from '../view/view-layout';

/** @public */
export namespace DispatchableEvent {
    export type Name<BCS extends BehavioredColumnSettings, SF extends SchemaField> = keyof Name.DetailMap<BCS, SF>;

    export namespace Name {
        export interface DetailMap<BCS extends BehavioredColumnSettings, SF extends SchemaField> {
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
            'rev-cell-enter': ViewCell<BCS, SF>;
            'rev-cell-exit': ViewCell<BCS, SF>;
            'rev-click': Detail.Pointer<BCS, SF>;
            'rev-dbl-click': Detail.Pointer<BCS, SF>;
            'rev-columns-view-widths-changed': ViewLayout.ColumnsViewWidthChangeds;
            'rev-grid-rendered': undefined;
            'rev-grid-resized': undefined;
            'rev-touch-start': TouchEvent;
            'rev-touch-move': TouchEvent;
            'rev-touch-end': TouchEvent;
            'rev-horizontal-scroll-viewport-changed': undefined;
            'rev-vertical-scroll-viewport-changed': undefined;
            'rev-horizontal-scroller-action': Scroller.Action;
            'rev-vertical-scroller-action': Scroller.Action;
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
            readonly oldPoint: Point | undefined;
            readonly newPoint: Point | undefined;
        }

        export interface RowFocusChanged {
            readonly oldSubgridRowIndex: number | undefined;
            readonly newSubgridRowIndex: number | undefined;
        }

        export interface Mouse<BCS extends BehavioredColumnSettings, SF extends SchemaField> extends MouseEvent {
            revgridHoverCell?: LinedHoverCell<BCS, SF>;
        }

        export interface Pointer<BCS extends BehavioredColumnSettings, SF extends SchemaField> extends PointerEvent, Mouse<BCS, SF> {
            revgridHoverCell?: LinedHoverCell<BCS, SF>;
        }

        export interface Wheel<BCS extends BehavioredColumnSettings, SF extends SchemaField> extends WheelEvent {
            revgridHoverCell?: LinedHoverCell<BCS, SF>;
        }

        export interface ColumnSort<BCS extends BehavioredColumnSettings, SF extends SchemaField> extends MouseEvent {
            revgridHoverCell?: LinedHoverCell<BCS, SF>;
        }
    }
}
