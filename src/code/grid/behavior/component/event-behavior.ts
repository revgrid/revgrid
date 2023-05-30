import { CanvasManager } from '../../components/canvas/canvas-manager';
import { ColumnsManager } from '../../components/column/columns-manager';
import { EventDetail } from '../../components/event/event-detail';
import { EventName } from '../../components/event/event-name';
import { Focus } from '../../components/focus/focus';
import { Mouse } from '../../components/mouse/mouse';
import { Renderer } from '../../components/renderer/renderer';
import { Scroller } from '../../components/scroller/scroller';
import { Selection } from '../../components/selection/selection';
import { ViewLayout } from '../../components/view/view-layout';
import { HoverCell } from '../../interfaces/data/hover-cell';
import { ViewCell } from '../../interfaces/data/view-cell';
import { Column } from '../../interfaces/schema/column';
import { Point } from '../../types-utils/point';
import { ListChangedTypeId } from '../../types-utils/types';

export class EventBehavior {
    uiKeyDownEventer: EventBehavior.UiKeyEventer;
    uiKeyUpEventer: EventBehavior.UiKeyEventer;
    uiClickEventer: EventBehavior.UiMouseEventer;
    uiDblClickEventer: EventBehavior.UiMouseEventer;
    uiPointerDownEventer: EventBehavior.UiPointerEventer;
    uiPointerUpCancelEventer: EventBehavior.UiPointerEventer;
    uiPointerMoveEventer: EventBehavior.UiPointerEventer;
    uiPointerEnterEventer: EventBehavior.UiPointerEventer;
    uiPointerLeaveOutEventer: EventBehavior.UiPointerEventer;
    uiPointerDragStartEventer: EventBehavior.UiPointerDragStartEventer;
    uiPointerDragEventer: EventBehavior.UiPointerDragEventer;
    uiPointerDragEndEventer: EventBehavior.UiPointerDragEventer;
    uiWheelMoveEventer: EventBehavior.UiWheelEventer;
    uiDragEventer: EventBehavior.UiDragEventer;
    uiDragStartEventer: EventBehavior.UiDragEventer;
    uiDragEnterEventer: EventBehavior.UiDragEventer;
    uiDragOverEventer: EventBehavior.UiDragEventer;
    uiDragLeaveEventer: EventBehavior.UiDragEventer;
    uiDragEndEventer: EventBehavior.UiDragEventer;
    uiDropEventer: EventBehavior.UiDragEventer;
    uiDocumentDragOverEventer: (this: void, event: DragEvent) => void;
    uiContextMenuEventer: EventBehavior.UiMouseEventer;
    uiTouchStartEventer: EventBehavior.UiTouchEventer;
    uiTouchMoveEventer: EventBehavior.UiTouchEventer;
    uiTouchEndEventer: EventBehavior.UiTouchEventer;
    uiCopyEventer: EventBehavior.UiClipboardEventer;
    uiHorizontalScrollerActionEventer: EventBehavior.UiScrollerActionEventer;
    uiVerticalScrollerActionEventer: EventBehavior.UiScrollerActionEventer;

    private readonly _dispatchEnabled: boolean;
    private _destroyed = false;

    constructor(
        dispatchEnabled: boolean,
        private readonly _canvasManager: CanvasManager,
        private readonly _columnsManager: ColumnsManager,
        private readonly _viewLayout: ViewLayout,
        private readonly _focus: Focus,
        private readonly _selection: Selection,
        private readonly _mouse: Mouse,
        private readonly _renderer: Renderer,
        private readonly _horizontalScroller: Scroller,
        private readonly _verticalScroller: Scroller,
        private readonly _descendantEventer: EventBehavior.DescendantEventer,
        private readonly _dispatchEventEventer: EventBehavior.DispatchEventEventer,
    ) {
        this._dispatchEnabled = dispatchEnabled;

        this._canvasManager.resizedEventerForEventBehavior = () => this.processCanvasResizedEvent();

        this._canvasManager.focusEventer = (event) => this.processFocusEvent(event);
        this._canvasManager.blurEventer = (event) => this.processBlurEvent(event);
        this._canvasManager.keyDownEventer = (event) => this.processKeyDownEvent(event);
        this._canvasManager.keyUpEventer = (event) => this.processKeyUpEvent(event);
        this._canvasManager.clickEventer = (event) => this.processClickEvent(event);
        this._canvasManager.dblClickEventer = (event) => this.processDblClickEvent(event);
        this._canvasManager.pointerEnterEventer = (event) => this.processPointerEnterEvent(event);
        this._canvasManager.pointerDownEventer = (event) => this.processPointerDownEvent(event);
        this._canvasManager.pointerUpCancelEventer = (event) => this.processPointerUpCancelEvent(event);
        this._canvasManager.pointerMoveEventer = (event) => this.processPointerMoveEvent(event);
        this._canvasManager.pointerLeaveOutEventer = (event) => this.processPointerLeaveOutEvent(event);
        this._canvasManager.pointerDragStartEventer = (event) => this.processPointerDragStartEvent(event);
        this._canvasManager.pointerDragEventer = (event, internal) => this.processPointerDragEvent(event, internal);
        this._canvasManager.pointerDragEndEventer = (event, internal) => this.processPointerDragEndEvent(event, internal);
        this._canvasManager.wheelMoveEventer = (event) => this.processWheelMoveEvent(event);
        this._canvasManager.contextMenuEventer = (event) => this.processContextMenuEvent(event);
        this._canvasManager.touchStartEventer = (event) => this.processTouchStartEvent(event);
        this._canvasManager.touchMoveEventer = (event) => this.processTouchMoveEvent(event);
        this._canvasManager.touchEndEventer = (event) => this.processTouchEndEvent(event);
        this._canvasManager.copyEventer = (event) => this.processCopyEvent(event);
        this._canvasManager.dragEventer = (event) => this.processDragEvent(event);
        this._canvasManager.dragStartEventer = (event) => this.processDragStartEvent(event);
        this._canvasManager.dragEnterEventer = (event) => this.processDragEnterEvent(event);
        this._canvasManager.dragOverEventer = (event) => this.processDragOverEvent(event);
        this._canvasManager.dragLeaveEventer = (event) => this.processDragLeaveEvent(event);
        this._canvasManager.dragEndEventer = (event) => this.processDragEndEvent(event);
        this._canvasManager.dropEventer = (event) => this.processDropEvent(event);
        this._canvasManager.documentDragOverEventer = (event) => this.processDocumentDragOverEvent(event);

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

        this._focus.changedEventer = (oldPoint, newPoint) => this.processCellFocusChangedEvent(oldPoint, newPoint);
        this._selection.changedEventerForEventBehavior = () => this.processSelectionChangedEvent();

        this._mouse.cellEnteredEventer = (cell) => this.processMouseEnteredCellEvent(cell);
        this._mouse.cellExitedEventer = (cell) => this.processMouseExitedCellEvent(cell);

        this._renderer.renderedEventer = () => this.processRenderedEvent();

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

    processColumnSortEvent(event: MouseEvent, cell: ViewCell) {
        this._descendantEventer.columnSort(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-column-sort', event, cell);
        }
    }

    private processCanvasResizedEvent() {
        this._descendantEventer.resized();

        if (this._dispatchEnabled) {
            const detail: EventDetail.Resize = {
                time: Date.now(),
                width: this._canvasManager.flooredContainerWidth,
                height: this._canvasManager.flooredContainerHeight
            };

            this.dispatchCustomEvent('rev-grid-resized', false, detail);
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

    private processColumnsWidthChangedEvent(columns: Column[], ui: boolean) {
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

    private processClickEvent(event: MouseEvent) {
        let cell = this.uiClickEventer(event);
        if (this._dispatchEnabled) {
            if (cell === undefined) {
                cell = this._viewLayout.findHoverCell(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.click(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-click', event, cell);
        }
    }

    private processDblClickEvent(event: MouseEvent) {
        let cell = this.uiDblClickEventer(event);
        if (this._dispatchEnabled) {
            if (cell === undefined) {
                cell = this._viewLayout.findHoverCell(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.dblClick(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-dbl-click', event, cell);
        }
    }

    private processPointerEnterEvent(event: PointerEvent) {
        let cell = this.uiPointerEnterEventer(event);
        if (this._dispatchEnabled) {
            if (cell === undefined) {
                cell = this._viewLayout.findHoverCell(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.pointerEnter(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-pointer-enter', event, cell);
        }
    }

    private processPointerDownEvent(event: PointerEvent) {
        let cell = this.uiPointerDownEventer(event);
        if (this._dispatchEnabled) {
            if (cell === undefined) {
                cell = this._viewLayout.findHoverCell(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.pointerDown(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-pointer-down', event, cell);
        }
    }

    private processPointerUpCancelEvent(event: PointerEvent) {
        let cell = this.uiPointerUpCancelEventer(event);
        if (this._dispatchEnabled) {
            if (cell === undefined) {
                cell = this._viewLayout.findHoverCell(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.pointerUpCancel(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-pointer-up-cancel', event, cell);
        }
    }

    private processPointerMoveEvent(event: PointerEvent) {
        let cell = this.uiPointerMoveEventer(event);
        if (this._dispatchEnabled) {
            if (cell === undefined) {
                cell = this._viewLayout.findHoverCell(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.pointerMove(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-pointer-move', event, cell);
        }
    }

    private processPointerLeaveOutEvent(event: PointerEvent) {
        let cell = this.uiPointerLeaveOutEventer(event);
        if (this._dispatchEnabled) {
            if (cell === undefined) {
                cell = this._viewLayout.findHoverCell(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.pointerLeaveOut(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-pointer-leave-out', event, cell);
        }
    }

    private processWheelMoveEvent(event: WheelEvent) {
        let cell = this.uiWheelMoveEventer(event);
        if (this._dispatchEnabled) {
            if (cell === undefined) {
                cell = this._viewLayout.findHoverCell(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.wheelMove(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-wheel-move', event, cell);
        }
    }

    private processDragEvent(event: DragEvent) {
        const cell = this.uiDragEventer(event);
        this._descendantEventer.drag(event, cell);
    }

    private processDragStartEvent(event: DragEvent) {
        this._descendantEventer.dragStart(event); // give descendant a chance to claim drag start
    }

    private processDragEnterEvent(event: DragEvent) {
        const cell = this.uiDragEnterEventer(event);
        this._descendantEventer.dragEnter(event, cell);
    }

    private processDragOverEvent(event: DragEvent) {
        const cell = this.uiDragOverEventer(event);
        this._descendantEventer.dragOver(event, cell);
    }

    private processDragLeaveEvent(event: DragEvent) {
        const cell = this.uiDragLeaveEventer(event);
        this._descendantEventer.dragLeave(event, cell);
    }

    private processDragEndEvent(event: DragEvent) {
        const cell = this.uiDragEndEventer(event);
        this._descendantEventer.dragEnd(event, cell);
    }

    private processDropEvent(event: DragEvent) {
        const cell = this.uiDropEventer(event);
        this._descendantEventer.drop(event, cell);
    }

    private processDocumentDragOverEvent(event: DragEvent) {
        this.uiDocumentDragOverEventer(event);
    }

    private processContextMenuEvent(event: MouseEvent) {
        let cell = this.uiContextMenuEventer(event);
        if (this._dispatchEnabled) {
            if (cell === undefined) {
                cell = this._viewLayout.findHoverCell(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.contextMenu(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-context-menu', event, cell);
        }
    }

    private processPointerDragStartEvent(event: DragEvent) {
        const result = this.uiPointerDragStartEventer(event);
        if (result.started) {
            return true; // internally started
        } else {
            // const cell = this.uiMouseDragStartEventer(event);
            const started = this._descendantEventer.pointerDragStart(event, result.cell);
            return started ? false : undefined;
        }
    }

    private processPointerDragEvent(event: PointerEvent, internal: boolean) {
        if (internal) {
            this.uiPointerDragEventer(event);
        } else {
            this._descendantEventer.pointerDrag(event);
        }
    }

    private processPointerDragEndEvent(event: PointerEvent, internal: boolean) {
        if (internal) {
            this.uiPointerDragEndEventer(event);
        } else {
            this._descendantEventer.pointerDragEnd(event);
        }
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

    private processCellFocusChangedEvent(oldPoint: Point | undefined, newPoint: Point | undefined) {
        this._descendantEventer.cellFocusChanged(oldPoint, newPoint);

        if (this._dispatchEnabled) {
            const detail: EventDetail.CellFocusChanged = {
                oldPoint,
                newPoint,
            };

            this.dispatchCustomEvent('rev-cell-focus-changed', false, detail);
        }
    }

    private processSelectionChangedEvent() {
        this._descendantEventer.selectionChanged();

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-selection-changed', false, undefined);
        }
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

    private processMouseEnteredCellEvent(cell: ViewCell) {
        this._descendantEventer.mouseEnteredCell(cell);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-cell-enter', false, cell);
        }
    }

    private processMouseExitedCellEvent(cell: ViewCell) {
        this._descendantEventer.mouseExitedCell(cell);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-cell-exit', false, cell);
        }
    }

    private processRenderedEvent() {
        this._descendantEventer.rendered();

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-grid-rendered', false, undefined);
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
                cell = Object.create(cell) as HoverCell; // clone cell
            }
        }
        const detail = event as EventName.DetailMap[T];
        detail.revgridCell = cell;
        return this.dispatchCustomEvent(eventName, false, detail);
    }
}

export namespace EventBehavior {
    export type DispatchEventEventer = (this: void, event: Event) => boolean;

    export interface UiPointerDragStartResult {
        readonly started: boolean;
        readonly cell: HoverCell | null | undefined;
    }

    export interface DescendantEventer {
        readonly allColumnListChanged: (this: void, typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined) => void;
        readonly activeColumnListChanged: (this: void, typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined, ui: boolean) => void;
        readonly columnsChanged: DescendantEventer.Signal;
        readonly columnsWidthChanged: (this: void, columns: Column[], ui: boolean) => void;
        readonly columnsViewWidthsChanged: DescendantEventer.Signal;
        readonly columnSort: (this: void, event: MouseEvent, cell: ViewCell) => void;
        readonly cellFocusChanged: DescendantEventer.CellFocusChanged;
        readonly selectionChanged: DescendantEventer.Signal;
        readonly focus: DescendantEventer.Focus;
        readonly blur: DescendantEventer.Focus;
        readonly keyDown: DescendantEventer.Key;
        readonly keyUp: DescendantEventer.Key;
        readonly click: DescendantEventer.Mouse;
        readonly dblClick: DescendantEventer.Mouse;
        readonly pointerEnter: DescendantEventer.Pointer;
        readonly pointerDown: DescendantEventer.Pointer;
        readonly pointerUpCancel: DescendantEventer.Pointer;
        readonly pointerMove: DescendantEventer.Pointer;
        readonly pointerLeaveOut: DescendantEventer.Pointer;
        readonly wheelMove: DescendantEventer.Wheel;
        readonly drag: DescendantEventer.DragCell;
        readonly dragStart: DescendantEventer.Drag;
        readonly dragEnter: DescendantEventer.DragCell;
        readonly dragOver: DescendantEventer.DragCell;
        readonly dragLeave: DescendantEventer.DragCell;
        readonly dragEnd: DescendantEventer.DragCell;
        readonly drop: DescendantEventer.DragCell;
        readonly contextMenu: DescendantEventer.Mouse;
        readonly pointerDragStart: DescendantEventer.PointerDragStart;
        readonly pointerDrag: DescendantEventer.PointerDrag;
        readonly pointerDragEnd: DescendantEventer.PointerDrag;
        readonly rendered: DescendantEventer.Signal;
        readonly mouseEnteredCell: DescendantEventer.ViewCellOnly;
        readonly mouseExitedCell: DescendantEventer.ViewCellOnly;
        readonly touchStart: DescendantEventer.Touch;
        readonly touchMove: DescendantEventer.Touch;
        readonly touchEnd: DescendantEventer.Touch;
        readonly copy: DescendantEventer.Clipboard;
        readonly resized: DescendantEventer.Signal;
        readonly horizontalScrollViewportStartChanged: DescendantEventer.Signal;
        readonly verticalScrollViewportStartChanged: DescendantEventer.Signal;
        readonly horizontalScrollerAction: DescendantEventer.ScrollerAction;
        readonly verticalScrollerAction: DescendantEventer.ScrollerAction;
    }

    export namespace DescendantEventer {
        export type Signal = (this: void) => void;
        export type Focus = (this: void, event: FocusEvent) => void;
        export type Key = (this: void, event: EventDetail.Keyboard) => void;
        export type Mouse = (this: void, event: MouseEvent, cell: HoverCell | null | undefined) => void;
        export type Pointer = (this: void, event: PointerEvent, cell: HoverCell | null | undefined) => void;
        export type PointerDrag = (this: void, event: PointerEvent) => void;
        export type PointerDragStart = (this: void, event: DragEvent, cell: HoverCell | null | undefined) => boolean; // This is not a typo. Drag event has the correct mouse down location
        export type Wheel = (this: void, event: WheelEvent, cell: HoverCell | null | undefined) => void;
        export type DragCell = (this: void, event: DragEvent, cell: HoverCell | null | undefined) => void;
        export type Drag = (this: void, event: DragEvent) => void;
        export type Touch = (this: void, event: TouchEvent) => void;
        export type ViewCellOnly = (this: void, cell: ViewCell) => void;
        export type Clipboard = (this: void, event: ClipboardEvent) => void;
        export type ScrollerAction = (this: void, event: EventDetail.ScrollerAction) => void;
        export type CellFocusChanged = (this: void, oldPoint: Point | undefined, newPoint: Point | undefined) => void;
    }

    export type UiKeyEventer = (this: void, keyboardEvent: EventDetail.Keyboard) => void;
    export type UiMouseEventer = (this: void, pointerEvent: EventDetail.Mouse) => HoverCell | null | undefined;
    export type UiPointerEventer = (this: void, pointerEvent: EventDetail.Pointer) => HoverCell | null | undefined;
    export type UiPointerDragEventer = (this: void, pointerEvent: EventDetail.Pointer) => void;
    export type UiPointerDragStartEventer = (this: void, dragEvent: DragEvent) => UiPointerDragStartResult;
    export type UiWheelEventer = (this: void, wheelEvent: EventDetail.Wheel) => HoverCell | null | undefined;
    export type UiDragEventer = (this: void, event: DragEvent) => HoverCell | null | undefined;
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
