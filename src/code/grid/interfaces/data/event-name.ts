// import { CellEditor } from '../../cell-editor/cell-editor';
import { SchemaServer } from '../schema/schema-server';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { EventDetail } from './event-detail';
import { ViewCell } from './view-cell';

/** @public */
export type EventName<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> = keyof EventName.DetailMap<BCS, SF>;

/** @public */
export namespace EventName {
    export interface DetailMap<BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> {
        // SchemaModel / DataModel
        'rev-schema-loaded': undefined;
        'rev-data-loaded': undefined;
        'rev-data-all-invalidated': undefined;
        'rev-data-rows-invalidated': EventDetail.RowsDataInvalidated;
        'rev-data-cell-invalidated': EventDetail.CellDataInvalidated;
        'rev-data-row-columns-invalidated': EventDetail.RowColumnsDataInvalidated;
        'rev-data-row-cells-invalidated': EventDetail.RowCellsDataInvalidated;
        'rev-data-row-count-changed': undefined;
        'rev-data-rows-moved': undefined;
        'rev-data-prereindex': undefined;
        'rev-data-postreindex': undefined;

        // Grid
        'rev-column-sort': EventDetail.ColumnSort<BCS, SF>;
        'rev-cell-focus-changed': EventDetail.CellFocusChanged;
        'rev-selection-changed': EventDetail.Grid;
        'rev-context-menu': EventDetail.Pointer<BCS, SF>;
        'rev-pointer-down': EventDetail.Pointer<BCS, SF>;
        'rev-pointer-up-cancel': EventDetail.Pointer<BCS, SF>;
        'rev-pointer-move': EventDetail.Pointer<BCS, SF>;
        'rev-pointer-enter': EventDetail.Pointer<BCS, SF>;
        'rev-pointer-leave-out': EventDetail.Pointer<BCS, SF>;
        'rev-wheel-move': EventDetail.Wheel<BCS, SF>;
        'rev-key-down': KeyboardEvent;
        'rev-key-up': KeyboardEvent;
        'rev-filter-applied': undefined;
        'rev-cell-enter': ViewCell<BCS, SF>;
        'rev-cell-exit': ViewCell<BCS, SF>;
        'rev-click': EventDetail.Pointer<BCS, SF>;
        'rev-dbl-click': EventDetail.Pointer<BCS, SF>;
        'rev-columns-view-widths-changed': undefined;
        'rev-grid-rendered': EventDetail.Grid;
        'rev-grid-resized': EventDetail.Resize;
        'rev-touch-start': TouchEvent;
        'rev-touch-move': TouchEvent;
        'rev-touch-end': TouchEvent;
        'rev-horizontal-scroll-viewport-changed': undefined;
        'rev-vertical-scroll-viewport-changed': undefined;
        'rev-horizontal-scroller-action': EventDetail.ScrollerAction;
        'rev-vertical-scroller-action': EventDetail.ScrollerAction;
        'rev-column-changed-event': undefined;
        'rev-columns-created': undefined;
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
