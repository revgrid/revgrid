import { CanvasEx } from '../../components/canvas-ex/canvas-ex';
import { ViewCell } from '../../components/cell/view-cell';
import { ColumnsManager } from '../../components/column/columns-manager';
import { EventDetail } from '../../components/event/event-detail';
import { EventName } from '../../components/event/event-name';
import { Scroller } from '../../components/scroller/scroller';
import { ViewLayout } from '../../components/view/view-layout';
import { ColumnInterface } from '../../interfaces/column-interface';
import { ListChangedTypeId } from '../../lib/types';

export class EventBehavior {
    uiKeyDownEventer: EventBehavior.UiKeyEventer;
    uiKeyUpEventer: EventBehavior.UiKeyEventer;
    uiMouseClickEventer: EventBehavior.UiMouseEventer;
    uiMouseDblClickEventer: EventBehavior.UiMouseEventer;
    uiMouseDownEventer: EventBehavior.UiMouseEventer;
    uiMouseUpEventer: EventBehavior.UiMouseEventer;
    uiMouseMoveEventer: EventBehavior.UiMouseEventer;
    uiMouseDragEventer: EventBehavior.UiMouseEventer;
    uiMouseEnteredCellEventer: EventBehavior.UiMouseEventer;
    uiMouseExitedCellEventer: EventBehavior.UiMouseEventer;
    uiWheelMoveEventer: EventBehavior.UiWheelEventer;
    uiContextMenuEventer: EventBehavior.UiMouseEventer;
    uiTouchStartEventer: EventBehavior.UiTouchEventer;
    uiTouchMoveEventer: EventBehavior.UiTouchEventer;
    uiTouchEndEventer: EventBehavior.UiTouchEventer;
    uiCopyEventer: EventBehavior.UiClipboardEventer;
    uiHorizontalScrollerActionEventer: EventBehavior.UiScrollerActionEventer;
    uiVerticalScrollerActionEventer: EventBehavior.UiScrollerActionEventer;

    private _dispatchEnabled = false;
    private _destroyed = false;

    constructor(
        private readonly _canvasEx: CanvasEx,
        private readonly _columnsManager: ColumnsManager,
        private readonly _viewLayout: ViewLayout,
        private readonly _horizontalScroller: Scroller,
        private readonly _verticalScroller: Scroller,
        private readonly _descendantEventer: EventBehavior.DescendantEventer,
        private readonly _dispatchEventEventer: EventBehavior.DispatchEventEventer,
    ) {
        this._canvasEx.focusEventer = (event) => this.processFocusEvent(event);
        this._canvasEx.blurEventer = (event) => this.processBlurEvent(event);
        this._canvasEx.keyDownEventer = (event) => this.processKeyDownEvent(event);
        this._canvasEx.keyUpEventer = (event) => this.processKeyUpEvent(event);
        this._canvasEx.mouseClickEventer = (event) => this.processMouseClickEvent(event);
        this._canvasEx.mouseDblClickEventer = (event) => this.processMouseDblClickEvent(event);
        this._canvasEx.mouseDownEventer = (event) => this.processMouseDownEvent(event);
        this._canvasEx.mouseUpEventer = (event) => this.processMouseUpEvent(event);
        this._canvasEx.mouseMoveEventer = (event) => this.processMouseMoveEvent(event);
        this._canvasEx.mouseDragStartEventer = (event) => this.processMouseDragStartEvent(event);
        this._canvasEx.mouseDragEventer = (event) => this.processMouseDragEvent(event);
        this._canvasEx.mouseDragEndEventer = (event) => this.processMouseDragEndEvent(event);
        this._canvasEx.mouseOutEventer = (event) => this.processMouseOutEvent(event);
        this._canvasEx.wheelMoveEventer = (event) => this.processWheelMoveEvent(event);
        this._canvasEx.contextMenuEventer = (event) => this.processContextMenuEvent(event);
        this._canvasEx.touchStartEventer = (event) => this.processTouchStartEvent(event);
        this._canvasEx.touchMoveEventer = (event) => this.processTouchMoveEvent(event);
        this._canvasEx.touchEndEventer = (event) => this.processTouchEndEvent(event);
        this._canvasEx.copyEventer = (event) => this.processCopyEvent(event);

        this._columnsManager.allColumnListChangedEventer = (typeId, index, count, targetIndex) => this.processAllColumnListChangedEvent(
            typeId, index, count, targetIndex
        );
        this._columnsManager.activeColumnListChangedEventer = (typeId, index, count, targetIndex, ui) => this.processActiveColumnListChangedEvent(
            typeId, index, count, targetIndex, ui
        );
        this._columnsManager.columnsWidthChangedEventer = (columns, ui) => this.processColumnsWidthChangedEvent(columns, ui);

        this._viewLayout.columnsViewWidthsChangedEventer = () => this.processColumnsViewWidthsChangedEvent();
        this._viewLayout.horizontalScrollDimension.eventBehaviorTargettedViewportStartChangedEventer = () => this.processHorizontalScrollViewportStartChangedEvent();
        this._viewLayout.verticalScrollDimension.eventBehaviorTargettedViewportStartChangedEventer = () => this.processVerticalScrollViewportStartChangedEvent();

        this._horizontalScroller.actionEventer = (action) => this.processHorizontalScrollerEvent(action);
        this._verticalScroller.actionEventer = (action) => this.processVerticalScrollerEvent(action);
    }

    destroy() {
        this._destroyed = true;
    }

    processColumnsChangedEvent() {
        this._descendantEventer.columnsChanged();

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-column-changed-event', false, undefined);
        }
    }

    /**
     * @desc Synthesize and fire a `fin-column-selection-changed` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    processSelectionChangedEvent() {
        this._descendantEventer.selectionChanged();

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-selection-changed', false, undefined);
        }
    }

    processRenderedEvent() {
        this._descendantEventer.rendered();

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-grid-rendered', false, undefined);
        }
    }

    processMouseEnteredCellEvent(cell: ViewCell) {
        this._descendantEventer.mouseEnteredCell(cell);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-cell-enter', false, cell);
        }
    }

    processMouseExitedCellEvent(cell: ViewCell) {
        this._descendantEventer.mouseExitedCell(cell);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-cell-exit', false, cell);
        }
    }

    processCanvasResizedEvent() {
        this._descendantEventer.resized();

        if (this._dispatchEnabled) {
            const detail: EventDetail.Resize = {
                time: Date.now(),
                width: this._canvasEx.width,
                height: this._canvasEx.height
            };

            this.dispatchCustomEvent('rev-grid-resized', false, detail);
        }
    }

    processColumnSortEvent(event: EventDetail.ColumnSort) {
        this._descendantEventer.columnSort(event);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-column-sort', false, event);
        }
    }

    private processAllColumnListChangedEvent(typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined) {
        this._descendantEventer.allColumnListChanged(typeId, index, count, targetIndex);
        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-columns-created', false, undefined);
        }
    }

    private processActiveColumnListChangedEvent(typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined, ui: boolean) {
        this._descendantEventer.activeColumnListChanged(typeId, index, count, targetIndex, ui);
    }

    private processColumnsWidthChangedEvent(columns: ColumnInterface[], ui: boolean) {
        this._descendantEventer.columnsWidthChanged(columns, ui);
    }

    private processColumnsViewWidthsChangedEvent() {
        this._descendantEventer.columnsViewWidthsChanged();

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-columns-view-widths-changed', false, undefined)
        }
    }

    private processHorizontalScrollViewportStartChangedEvent() {
        this._descendantEventer.horizontalScrollViewportStartChanged();

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-horizontal-scroll-viewport-changed', false, undefined);
        }
    }

    private processVerticalScrollViewportStartChangedEvent() {
        this._descendantEventer.verticalScrollViewportStartChanged();

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-vertical-scroll-viewport-changed', false, undefined);
        }
    }

    private processFocusEvent(event: FocusEvent) {
        this._descendantEventer.focus(event);
    }

    private processBlurEvent(event: FocusEvent) {
        this._descendantEventer.blur(event);
    }

    private processKeyDownEvent(event: EventDetail.Keyboard) {
        this.uiKeyDownEventer(event);

        this._descendantEventer.keyDown(event);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-key-down', false, event);
        }
    }

    private processKeyUpEvent(event: EventDetail.Keyboard) {
        this.uiKeyUpEventer(event);

        this._descendantEventer.keyUp(event);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-key-up', false, event);
        }
    }

    private processMouseClickEvent(event: MouseEvent) {
        let cell = this.uiMouseClickEventer(event);
        if (this._dispatchEnabled) {
            cell = this._viewLayout.findLeftGridLineInclusiveCellFromCanvasOffset(event.offsetX, event.offsetY);
        }

        this._descendantEventer.mouseClick(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-click', event, cell);
        }
    }

    private processMouseDblClickEvent(event: MouseEvent) {
        let cell = this.uiMouseDblClickEventer(event);
        if (this._dispatchEnabled) {
            cell = this._viewLayout.findLeftGridLineInclusiveCellFromCanvasOffset(event.offsetX, event.offsetY);
        }


        this._descendantEventer.mouseDblClick(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-dbl-click', event, cell);
        }
    }

    private processMouseDownEvent(event: MouseEvent) {
        let cell = this.uiMouseDownEventer(event);
        if (this._dispatchEnabled) {
            cell = this._viewLayout.findLeftGridLineInclusiveCellFromCanvasOffset(event.offsetX, event.offsetY);
        }

        this._descendantEventer.mouseDown(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-mouse-down', event, cell);
        }
    }

    private processMouseUpEvent(event: MouseEvent) {
        let cell = this.uiMouseUpEventer(event);
        if (this._dispatchEnabled) {
            cell = this._viewLayout.findLeftGridLineInclusiveCellFromCanvasOffset(event.offsetX, event.offsetY);
        }

        this._descendantEventer.mouseUp(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-mouse-up', event, cell);
        }
    }

    private processMouseMoveEvent(event: MouseEvent) {
        let cell = this.uiMouseMoveEventer(event);
        if (this._dispatchEnabled) {
            cell = this._viewLayout.findLeftGridLineInclusiveCellFromCanvasOffset(event.offsetX, event.offsetY);
        }

        this._descendantEventer.mouseMove(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-mouse-move', event, cell);
        }
    }

    private processMouseOutEvent(event: MouseEvent) {
        const cell = this.uiMouseExitedCellEventer(event);
        // if (this._dispatchEnabled) {
        //     cell = this._viewLayout.findLeftGridLineInclusiveCellFromOffset(event.offsetX, event.offsetY);
        // }

        this._descendantEventer.mouseOut(event, cell);

        // if (this._dispatchEnabled) {
        //     this.dispatchMouseGridEvent('rev-mouse-out', event, cell);
        // }
    }

    private processWheelMoveEvent(event: WheelEvent) {
        let cell = this.uiWheelMoveEventer(event);
        if (this._dispatchEnabled) {
            cell = this._viewLayout.findLeftGridLineInclusiveCellFromCanvasOffset(event.offsetX, event.offsetY);
        }

        this._descendantEventer.wheelMove(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-wheel-move', event, cell);
        }
    }

    private processContextMenuEvent(event: MouseEvent) {
        let cell = this.uiContextMenuEventer(event);
        if (this._dispatchEnabled) {
            cell = this._viewLayout.findLeftGridLineInclusiveCellFromCanvasOffset(event.offsetX, event.offsetY);
        }

        this._descendantEventer.contextMenu(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-context-menu', event, cell);
        }
    }

    private processMouseDragStartEvent(event: MouseEvent) {
        // const cell = this.uiMouseDragStartEventer(event);
        this._descendantEventer.mouseDragStart(event, undefined);
    }

    private processMouseDragEvent(event: MouseEvent) {
        const cell = this.uiMouseDragEventer(event);
        this._descendantEventer.mouseDrag(event, cell);
    }

    private processMouseDragEndEvent(event: MouseEvent) {
        // const cell = this.uiMouseDragEndEventer(event);
        this._descendantEventer.mouseDragEnd(event, undefined);
    }

    private processTouchStartEvent(event: TouchEvent) {
        this.uiTouchStartEventer(event);

        this._descendantEventer.touchStart(event);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-touch-start', false, event);
        }
    }

    private processTouchMoveEvent(event: TouchEvent) {
        this.uiTouchMoveEventer(event);

        this._descendantEventer.touchMove(event);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-touch-move', false, event);
        }
    }

    private processTouchEndEvent(event: TouchEvent) {
        this.uiTouchEndEventer(event);

        this._descendantEventer.touchEnd(event);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-touch-end', false, event);
        }
    }

    private processCopyEvent(event: ClipboardEvent) {
        this.uiCopyEventer(event);

        this._descendantEventer.copy(event);
    }

    private processHorizontalScrollerEvent(action: EventDetail.ScrollerAction) {
        this.uiHorizontalScrollerActionEventer(action);

        this._descendantEventer.horizontalScrollerAction(action);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-horizontal-scroller-action', false, action);
        }
    }

    private processVerticalScrollerEvent(action: EventDetail.ScrollerAction) {
        this.uiVerticalScrollerActionEventer(action);

        this._descendantEventer.verticalScrollerAction(action);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-vertical-scroller-action', false, action);
        }
    }

    private dispatchCustomEvent<T extends EventName>(
        eventName: T,
        cancelable: boolean,
        eventDetail: EventName.DetailMap[T] | undefined,
    ): boolean {
        if (this._destroyed) {
            return false;
        } else {

            // let eventInitDictOrDetail: DispatchGridEvent.EventInitDictOrDetail;
            // if (eventDetail === undefined) {
            //     eventInitDictOrDetail = {};
            // } else {
            //     if (eventDetail instanceof CustomEvent) {
            //         eventInitDictOrDetail = Object({});
            //         throw new Error('dispatchGridEvent should not be passed CustomEvents anymore [1]');
            //     } else {
            //         eventInitDictOrDetail = eventDetail;
            //     }
            // }

            // if (!("type" in eventInitDictOrDetail)) {
            //     (eventInitDictOrDetail as DispatchGridEvent.ExtraDetail).type = eventName;
            // }

            // let eventInitDict: CustomEventInit<DispatchGridEvent.ExtraDetail>;

            // if (!("detail" in eventInitDictOrDetail)) {
            //     eventInitDict = {
            //         detail: eventInitDictOrDetail as DispatchGridEvent.ExtraDetail,
            //     };
            // } else {
            //     eventInitDict = eventInitDictOrDetail as CustomEventInit<DispatchGridEvent.ExtraDetail>;
            //     throw new Error('dispatchGridEvent should not be passed CustomEvents anymore [2]');
            // }

            // const detail = eventInitDict.detail;

            // if (!detail.grid) {
            //     // CellEvent objects already have a (read-only) `grid` prop
            //     detail.grid = grid;
            // }

            // detail.time = Date.now();

            // if (primitiveEvent !== undefined) {
            //     if (!detail.primitiveEvent) {
            //         detail.primitiveEvent = primitiveEvent;
            //     }
            //     wantedDetailFields.forEach((key) => {
            //         if (key in primitiveEvent && !(key in detail)) {
            //             detail[key] = primitiveEvent[key] as unknown;
            //         }
            //     });
            //     if ("dataRow" in primitiveEvent) {
            //         // reference (without invoking) cellEvent's `dataRow` getter when available
            //         Object.defineProperty(detail, "row", {
            //             get: function () {
            //                 return primitiveEvent.dataRow;
            //             },
            //         });
            //     }
            // }

            // eventInitDict.cancelable = cancelable;

            // const event = newEvent(eventName, eventDetail, cancelable);
            const eventInit: CustomEventInit<EventName.DetailMap[T]> = {
                detail: eventDetail,
                cancelable,
            };

            const event = new CustomEvent<EventName.DetailMap[T]>(eventName, eventInit);

            return this._dispatchEventEventer(event);
        }
    }

    private dispatchMouseEvent<T extends EventName.Mouse>(eventName: T, event: MouseEvent | WheelEvent, cell: ViewCell | null | undefined) {
        if (cell === null) {
            cell = undefined;
        } else {
            if (cell !== undefined) {
                cell = Object.create(cell) as ViewCell; // clone cell
            }
        }
        const detail = event as EventName.DetailMap[T];
        detail.revgridViewCell = cell;
        return this.dispatchCustomEvent(eventName, false, detail);
    }
}

export namespace EventBehavior {
    export type DispatchEventEventer = (this: void, event: Event) => boolean;

    export interface DescendantEventer {
        readonly allColumnListChanged: (this: void, typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined) => void;
        readonly activeColumnListChanged: (this: void, typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined, ui: boolean) => void;
        readonly columnsChanged: DescendantEventer.Signal;
        readonly columnsWidthChanged: (this: void, columns: ColumnInterface[], ui: boolean) => void;
        readonly columnsViewWidthsChanged: DescendantEventer.Signal;
        readonly selectionChanged: DescendantEventer.Signal;
        readonly focus: DescendantEventer.Focus;
        readonly blur: DescendantEventer.Focus;
        readonly keyDown: DescendantEventer.Key;
        readonly keyUp: DescendantEventer.Key;
        readonly mouseClick: DescendantEventer.Mouse;
        readonly mouseDblClick: DescendantEventer.Mouse;
        readonly mouseDown: DescendantEventer.Mouse;
        readonly mouseUp: DescendantEventer.Mouse;
        readonly mouseMove: DescendantEventer.Mouse;
        readonly mouseOut: DescendantEventer.Mouse;
        readonly wheelMove: DescendantEventer.Wheel;
        readonly contextMenu: DescendantEventer.Mouse;
        readonly mouseDragStart: DescendantEventer.Mouse;
        readonly mouseDrag: DescendantEventer.Mouse;
        readonly mouseDragEnd: DescendantEventer.Mouse;
        readonly rendered: DescendantEventer.Signal;
        readonly mouseEnteredCell: DescendantEventer.Cell;
        readonly mouseExitedCell: DescendantEventer.Cell;
        readonly touchStart: DescendantEventer.Touch;
        readonly touchMove: DescendantEventer.Touch;
        readonly touchEnd: DescendantEventer.Touch;
        readonly copy: DescendantEventer.Clipboard;
        readonly resized: DescendantEventer.Signal;
        readonly columnSort: (this: void, eventDetail: EventDetail.ColumnSort) => void;
        readonly horizontalScrollViewportStartChanged: DescendantEventer.Signal;
        readonly verticalScrollViewportStartChanged: DescendantEventer.Signal;
        readonly horizontalScrollerAction: DescendantEventer.ScrollerAction;
        readonly verticalScrollerAction: DescendantEventer.ScrollerAction;
    }

    export namespace DescendantEventer {
        export type Signal = (this: void) => void;
        export type Focus = (this: void, event: FocusEvent) => void;
        export type Key = (this: void, event: EventDetail.Keyboard) => void;
        export type Mouse = (this: void, event: MouseEvent, cell: ViewCell | null | undefined) => void;
        export type Wheel = (this: void, event: WheelEvent, cell: ViewCell | null | undefined) => void;
        export type Touch = (this: void, event: TouchEvent) => void;
        export type Cell = (this: void, cell: ViewCell) => void;
        export type Clipboard = (this: void, event: ClipboardEvent) => void;
        export type ScrollerAction = (this: void, event: EventDetail.ScrollerAction) => void;
    }

    export type UiKeyEventer = (this: void, keyboardEvent: EventDetail.Keyboard) => void;
    export type UiMouseEventer = (this: void, mouseEvent: EventDetail.Mouse) => ViewCell | null | undefined;
    export type UiWheelEventer = (this: void, wheelEvent: EventDetail.Wheel) => ViewCell | null | undefined;
    export type UiTouchEventer = (this: void, touchEvent: TouchEvent) => void;
    export type UiClipboardEventer = (this: void, clipboardEvent: ClipboardEvent) => void;
    export type UiScrollerActionEventer = (this: void, action: EventDetail.ScrollerAction) => void;

    // Extra properties added to Event Detail
    // export interface ExtraDetail {
    //     type: string;
    //     grid: Hypegrid;
    //     time: number;
    //     primitiveEvent: CellEvent | MouseEvent | KeyboardEvent | Point;

    //     gridCell: WritablePoint,
    //     dataCell: WritablePoint,
    //     mousePoint: Point,
    //     gridPoint: Point,
    //     clientPoint: Point,
    //     pagePoint: Point,
    //     keys: string[],
    //     row: unknown,
    // }

    // export type UntypedEventInitDictOrDetail =
    //     | CustomEventInit
    //     | EventDetail.Resize
    //     | EventDetail.Keyboard
    //     | EventDetail.Touch
    //     | CellEditor.EventDetail
    //     | EventDetail.ColumnSortDetail
    //     | SelectionDetail
    //     | EventDetail.GridDetail
    //     | EventDetail.ScrollDetail
    //     | EventDetail.RowDataInvalidatedDetail
    //     | EventDetail.CellDataInvalidatedDetail
    //     | CellEvent;

    // export type EventInitDictOrDetail = UntypedEventInitDictOrDetail | ExtraDetail;
}
