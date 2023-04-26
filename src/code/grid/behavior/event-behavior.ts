import { CanvasEx } from '../canvas/canvas-ex';
import { ViewportCell } from '../cell/viewport-cell';
import { ColumnInterface } from '../common/column-interface';
import { EventDetail } from '../event/event-detail';
import { EventName } from '../event/event-name';
import { newEvent } from '../event/event-util';
import { ListChangedTypeId } from '../lib/types';
import { Viewport } from '../renderer/viewport';
import { Selection } from '../selection/selection';
import { SelectionDetailAccessor } from '../selection/selection-detail';

export class EventBehavior {
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

    private _dispatchEnabled = false;
    private _destroyed = false;

    constructor(
        private readonly _canvasEx: CanvasEx,
        private readonly _selection: Selection,
        private readonly _viewport: Viewport,
        private readonly _descendantEventer: EventBehavior.DescendantEventer,
        private readonly _dispatchEventEventer: EventBehavior.DispatchEventEventer,
    ) {
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
    }

    destroy() {
        this._destroyed = true;
    }

    processAllColumnListChangedEvent(typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined) {
        this._descendantEventer.allColumnListChanged(typeId, index, count, targetIndex);
        if (this._dispatchEnabled) {
            this.dispatchGridEvent('rev-columns-created', false, undefined);
        }
    }

    processActiveColumnListChangedEvent(typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined, ui: boolean) {
        this._descendantEventer.activeColumnListChanged(typeId, index, count, targetIndex, ui);
    }

    processColumnsWidthChangedEvent(columns: ColumnInterface[], ui: boolean) {
        this._descendantEventer.columnsWidthChanged(columns, ui);
    }

    /**
     * @desc Synthesize and fire a `fin-column-selection-changed` event.
     * @returns Proceed; event was not [canceled](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent#Return_Value `EventTarget.dispatchEvent`).
     */
    processSelectionChangedEvent() {
        this._descendantEventer.selectionChanged();

        if (this._dispatchEnabled) {
            const selectionDetail = new SelectionDetailAccessor(this._selection);
            this.dispatchGridEvent('rev-selection-changed', false, selectionDetail);
        }
    }

    processScrollEvent(isX: boolean, newValue: number, index: number, offset: number) {
        this._descendantEventer.scroll(isX, newValue, index, offset);

        if (this._dispatchEnabled) {
            const eventName = isX ? 'rev-scroll-x' : 'rev-scroll-y';
            const eventDetail: EventDetail.Scroll = {
                time: Date.now(),
                value: newValue,
                index,
                offset,
            };
            this.dispatchGridEvent(eventName, false, eventDetail);
        }
    }

    processRenderedEvent() {
        this._descendantEventer.rendered();

        if (this._dispatchEnabled) {
            this.dispatchGridEvent('rev-grid-rendered', false, undefined);
        }
    }

    processMouseEnteredCellEvent(cell: ViewportCell) {
        this._descendantEventer.mouseEnteredCell(cell);

        if (this._dispatchEnabled) {
            this.dispatchGridEvent('rev-cell-enter', false, cell);
        }
    }

    processMouseExitedCellEvent(cell: ViewportCell) {
        this._descendantEventer.mouseExitedCell(cell);

        if (this._dispatchEnabled) {
            this.dispatchGridEvent('rev-cell-exit', false, cell);
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

            this.dispatchGridEvent('rev-grid-resized', false, detail);
        }
    }

    private processMouseClickEvent(event: MouseEvent) {
        let cell = this.uiMouseClickEventer(event);
        if (this._dispatchEnabled) {
            cell = this._viewport.findLeftGridLineInclusiveCellFromOffset(event.offsetX, event.offsetY);
        }

        this._descendantEventer.mouseClick(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseGridEvent('rev-click', event, cell);
        }
    }

    private processMouseDblClickEvent(event: MouseEvent) {
        let cell = this.uiMouseDblClickEventer(event);
        if (this._dispatchEnabled) {
            cell = this._viewport.findLeftGridLineInclusiveCellFromOffset(event.offsetX, event.offsetY);
        }


        this._descendantEventer.mouseDblClick(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseGridEvent('rev-dbl-click', event, cell);
        }
    }

    private processMouseDownEvent(event: MouseEvent) {
        let cell = this.uiMouseDownEventer(event);
        if (this._dispatchEnabled) {
            cell = this._viewport.findLeftGridLineInclusiveCellFromOffset(event.offsetX, event.offsetY);
        }

        this._descendantEventer.mouseDown(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseGridEvent('rev-mouse-down', event, cell);
        }
    }

    private processMouseUpEvent(event: MouseEvent) {
        let cell = this.uiMouseUpEventer(event);
        if (this._dispatchEnabled) {
            cell = this._viewport.findLeftGridLineInclusiveCellFromOffset(event.offsetX, event.offsetY);
        }

        this._descendantEventer.mouseUp(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseGridEvent('rev-mouse-up', event, cell);
        }
    }

    private processMouseMoveEvent(event: MouseEvent) {
        let cell = this.uiMouseMoveEventer(event);
        if (this._dispatchEnabled) {
            cell = this._viewport.findLeftGridLineInclusiveCellFromOffset(event.offsetX, event.offsetY);
        }

        this._descendantEventer.mouseMove(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseGridEvent('rev-mouse-move', event, cell);
        }
    }

    private processMouseOutEvent(event: MouseEvent) {
        const cell = this.uiMouseExitedCellEventer(event);
        // if (this._dispatchEnabled) {
        //     cell = this._viewport.findLeftGridLineInclusiveCellFromOffset(event.offsetX, event.offsetY);
        // }

        this._descendantEventer.mouseOut(event, cell);

        // if (this._dispatchEnabled) {
        //     this.dispatchMouseGridEvent('rev-mouse-out', event, cell);
        // }
    }

    private processWheelMoveEvent(event: WheelEvent) {
        let cell = this.uiWheelMoveEventer(event);
        if (this._dispatchEnabled) {
            cell = this._viewport.findLeftGridLineInclusiveCellFromOffset(event.offsetX, event.offsetY);
        }

        this._descendantEventer.wheelMove(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseGridEvent('rev-wheel-move', event, cell);
        }
    }

    private processContextMenuEvent(event: MouseEvent) {
        let cell = this.uiContextMenuEventer(event);
        if (this._dispatchEnabled) {
            cell = this._viewport.findLeftGridLineInclusiveCellFromOffset(event.offsetX, event.offsetY);
        }

        this._descendantEventer.contextMenu(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseGridEvent('rev-context-menu', event, cell);
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


    private dispatchGridEvent<T extends EventName>(
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

            const event = newEvent(eventName, eventDetail, cancelable);
            return this._dispatchEventEventer(event);
        }
    }

    private dispatchMouseGridEvent(eventName: EventName.Mouse, event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (cell === null) {
            cell = undefined;
        } else {
            if (cell !== undefined) {
                cell = Object.create(cell) as ViewportCell; // clone cell
            }
        }
        const eventDetail = event as EventDetail.Mouse;
        eventDetail.revgridViewportCell = cell;
        this.dispatchGridEvent(eventName, false, eventDetail);
    }
}

export namespace EventBehavior {
    export type DispatchEventEventer = (this: void, event: Event) => boolean;

    export interface DescendantEventer {
        readonly allColumnListChanged: (this: void, typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined) => void;
        readonly activeColumnListChanged: (this: void, typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined, ui: boolean) => void;
        readonly columnsWidthChanged: (this: void, columns: ColumnInterface[], ui: boolean) => void;
        readonly selectionChanged: (this: void) => void;
        readonly scroll: (this:void, isX: boolean, newValue: number, index: number, offset: number) => void;
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
        readonly rendered: (this: void) => void;
        readonly mouseEnteredCell: DescendantEventer.Cell;
        readonly mouseExitedCell: DescendantEventer.Cell;
        readonly resized: (this: void) => void;
    }

    export namespace DescendantEventer {
        export type Mouse = (this: void, event: MouseEvent, cell: ViewportCell | null | undefined) => void;
        export type Wheel = (this: void, event: WheelEvent, cell: ViewportCell | null | undefined) => void;
        export type Cell = (this: void, cell: ViewportCell) => void;
    }

    export type UiMouseEventer = (this: void, mouseEvent: MouseEvent) => ViewportCell | null | undefined;
    export type UiWheelEventer = (this: void, wheelEvent: WheelEvent) => ViewportCell | null | undefined;

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
