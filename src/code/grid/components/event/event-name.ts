// import { CellEditor } from '../../cell-editor/cell-editor';
import { ViewCell } from '../cell/view-cell';
import { EventDetail } from './event-detail';

/** @public */
export type EventName = keyof EventName.DetailMap;

/** @public */
export namespace EventName {
    export interface DetailMap {
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
        'rev-column-sort': EventDetail.ColumnSort;
        'rev-selection-changed': EventDetail.Grid;
        'rev-context-menu': EventDetail.Mouse;
        'rev-mouse-up': EventDetail.Mouse;
        'rev-mouse-down': EventDetail.Mouse;
        'rev-mouse-move': EventDetail.Mouse;
        'rev-wheel-move': EventDetail.Wheel;
        'rev-key-down': EventDetail.Keyboard;
        'rev-key-up': EventDetail.Keyboard;
        'rev-filter-applied': undefined;
        'rev-cell-enter': ViewCell;
        'rev-cell-exit': ViewCell;
        'rev-click': EventDetail.Mouse;
        'rev-dbl-click': EventDetail.Mouse;
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

    export type Mouse = 'rev-click' | 'rev-dbl-click' | 'rev-mouse-down' | 'rev-mouse-up' | 'rev-mouse-move' | 'rev-wheel-move' | 'rev-context-menu' | 'rev-column-sort';
}
