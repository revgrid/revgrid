// import { CellEditor } from '../../cell-editor/cell-editor';
import { ViewCell } from '../../interfaces/data/view-cell';
import { MergableColumnSettings } from '../../interfaces/settings/mergable-column-settings';
import { EventDetail } from './event-detail';

/** @public */
export type EventName<MCS extends MergableColumnSettings> = keyof EventName.DetailMap<MCS>;

/** @public */
export namespace EventName {
    export interface DetailMap<MCS extends MergableColumnSettings> {
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
        'rev-column-sort': EventDetail.ColumnSort<MCS>;
        'rev-cell-focus-changed': EventDetail.CellFocusChanged;
        'rev-selection-changed': EventDetail.Grid;
        'rev-context-menu': EventDetail.Pointer<MCS>;
        'rev-pointer-down': EventDetail.Pointer<MCS>;
        'rev-pointer-up-cancel': EventDetail.Pointer<MCS>;
        'rev-pointer-move': EventDetail.Pointer<MCS>;
        'rev-pointer-enter': EventDetail.Pointer<MCS>;
        'rev-pointer-leave-out': EventDetail.Pointer<MCS>;
        'rev-wheel-move': EventDetail.Wheel<MCS>;
        'rev-key-down': EventDetail.Keyboard;
        'rev-key-up': EventDetail.Keyboard;
        'rev-filter-applied': undefined;
        'rev-cell-enter': ViewCell<MCS>;
        'rev-cell-exit': ViewCell<MCS>;
        'rev-click': EventDetail.Pointer<MCS>;
        'rev-dbl-click': EventDetail.Pointer<MCS>;
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

    export type Mouse =
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
