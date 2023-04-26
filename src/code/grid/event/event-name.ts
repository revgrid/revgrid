import { CellEditor } from '../cell-editor/cell-editor';
import { CellEvent } from '../cell/cell-event';
import { SelectionDetail } from '../selection/selection-detail';
import { EventDetail } from './event-detail';

/** @public */
export type EventName = keyof EventName.DetailMap;

/** @public */
export namespace EventName {
    export interface DetailMap {
        // Canvas
        'rev-canvas-keydown': EventDetail.Keyboard;
        'rev-canvas-keyup': EventDetail.Keyboard;
        'rev-canvas-focus-gained': undefined;
        'rev-canvas-focus-lost': undefined;
        'rev-canvas-touchstart': EventDetail.Touch;
        'rev-canvas-touchmove': EventDetail.Touch;
        'rev-canvas-touchend': EventDetail.Touch;
        'rev-canvas-resized': EventDetail.Resize;

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
        'rev-editor-key-up': CellEditor.KeyEventDetail;
        'rev-editor-key-down': CellEditor.KeyEventDetail;
        'rev-editor-key-press': CellEditor.KeyEventDetail;
        'rev-editor-data-change': CellEditor.DataChangeEventDetail;
        'rev-selection-changed': SelectionDetail;
        'rev-context-menu': EventDetail.Mouse;
        'rev-mouse-up': EventDetail.Mouse;
        'rev-mouse-down': EventDetail.Mouse;
        'rev-mouse-move': EventDetail.Mouse;
        'rev-wheel-move': EventDetail.Wheel;
        'rev-button-pressed': CellEvent;
        'rev-key-down': EventDetail.Keyboard;
        'rev-key-up': EventDetail.Keyboard;
        'rev-filter-applied': undefined;
        'rev-cell-enter': CellEvent;
        'rev-cell-exit': CellEvent;
        'rev-click': EventDetail.Mouse;
        'rev-dbl-click': EventDetail.Mouse;
        'rev-columns-view-widths-changed': EventDetail.ColumnsViewWidthsChanged;
        'rev-grid-rendered': EventDetail.Grid;
        'rev-grid-resized': EventDetail.Resize;
        'rev-touch-start': EventDetail.Touch;
        'rev-touch-move': EventDetail.Touch;
        'rev-touch-end': EventDetail.Touch;
        'rev-scroll-x': EventDetail.Scroll;
        'rev-scroll-y': EventDetail.Scroll;
        'rev-request-cell-edit': CellEditor.RequestCellEditDetail;
        'rev-before-cell-edit': CellEditor.DataChangeEventDetail;
        'rev-after-cell-edit': CellEditor.DataChangeEventDetail;
        'rev-column-changed-event': undefined;
        'rev-columns-created': undefined;
    }

    export type Mouse = 'rev-click' | 'rev-dbl-click' | 'rev-mouse-down' | 'rev-mouse-up' | 'rev-mouse-move' | 'rev-wheel-move' | 'rev-context-menu';
}
