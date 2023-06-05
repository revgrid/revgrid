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
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { Point } from '../../types-utils/point';
import { ListChangedTypeId } from '../../types-utils/types';

/** @public */
export class EventBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings> {
    /** @internal */
    uiKeyDownEventer: EventBehavior.UiKeyEventer;
    /** @internal */
    uiKeyUpEventer: EventBehavior.UiKeyEventer;
    /** @internal */
    uiClickEventer: EventBehavior.UiMouseEventer<BCS>;
    /** @internal */
    uiDblClickEventer: EventBehavior.UiMouseEventer<BCS>;
    /** @internal */
    uiPointerDownEventer: EventBehavior.UiPointerEventer<BCS>;
    /** @internal */
    uiPointerUpCancelEventer: EventBehavior.UiPointerEventer<BCS>;
    /** @internal */
    uiPointerMoveEventer: EventBehavior.UiPointerEventer<BCS>;
    /** @internal */
    uiPointerEnterEventer: EventBehavior.UiPointerEventer<BCS>;
    /** @internal */
    uiPointerLeaveOutEventer: EventBehavior.UiPointerEventer<BCS>;
    /** @internal */
    uiPointerDragStartEventer: EventBehavior.UiPointerDragStartEventer<BCS>;
    /** @internal */
    uiPointerDragEventer: EventBehavior.UiPointerDragEventer<BCS>;
    /** @internal */
    uiPointerDragEndEventer: EventBehavior.UiPointerDragEventer<BCS>;
    /** @internal */
    uiWheelMoveEventer: EventBehavior.UiWheelEventer<BCS>;
    /** @internal */
    uiContextMenuEventer: EventBehavior.UiMouseEventer<BCS>;
    /** @internal */
    uiTouchStartEventer: EventBehavior.UiTouchEventer;
    /** @internal */
    uiTouchMoveEventer: EventBehavior.UiTouchEventer;
    /** @internal */
    uiTouchEndEventer: EventBehavior.UiTouchEventer;
    /** @internal */
    uiCopyEventer: EventBehavior.UiClipboardEventer;
    /** @internal */
    uiHorizontalScrollerActionEventer: EventBehavior.UiScrollerActionEventer;
    /** @internal */
    uiVerticalScrollerActionEventer: EventBehavior.UiScrollerActionEventer;

    /** @internal */
    private readonly _dispatchEnabled: boolean;
    /** @internal */
    private _destroyed = false;

    /** @internal */
    constructor(
        dispatchEnabled: boolean,
        /** @internal */
        private readonly _canvasManager: CanvasManager<BGS>,
        /** @internal */
        private readonly _columnsManager: ColumnsManager<BGS, BCS>,
        /** @internal */
        private readonly _viewLayout: ViewLayout<BGS, BCS>,
        /** @internal */
        private readonly _focus: Focus<BGS, BCS>,
        /** @internal */
        private readonly _selection: Selection<BGS, BCS>,
        /** @internal */
        private readonly _mouse: Mouse<BGS, BCS>,
        /** @internal */
        private readonly _renderer: Renderer<BGS, BCS>,
        /** @internal */
        private readonly _horizontalScroller: Scroller<BGS>,
        /** @internal */
        private readonly _verticalScroller: Scroller<BGS>,
        /** @internal */
        private readonly _descendantEventer: EventBehavior.DescendantEventer<BCS>,
        /** @internal */
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
        this._canvasManager.dragStartEventer = (event) => this.processDragStartEvent(event);

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

    /** @internal */
    destroy() {
        this._destroyed = true;
    }

    /** @internal */
    processColumnsChangedEvent() {
        this._descendantEventer.columnsChanged();

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-column-changed-event', false, undefined);
        }
    }

    /** @internal */
    processColumnSortEvent(event: MouseEvent, cell: ViewCell<BCS>) {
        this._descendantEventer.columnSort(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseEvent('rev-column-sort', event, cell);
        }
    }

    /** @internal */
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

    /** @internal */
    private processAllColumnListChangedEvent(typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined) {
        this._descendantEventer.allColumnListChanged(typeId, index, count, targetIndex);
        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-columns-created', false, undefined);
        }
    }

    /** @internal */
    private processActiveColumnListChangedEvent(typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined, ui: boolean) {
        this._descendantEventer.activeColumnListChanged(typeId, index, count, targetIndex, ui);
    }

    /** @internal */
    private processColumnsWidthChangedEvent(columns: Column<BCS>[], ui: boolean) {
        this._descendantEventer.columnsWidthChanged(columns, ui);
    }

    /** @internal */
    private processColumnsViewWidthsChangedEvent() {
        this._descendantEventer.columnsViewWidthsChanged();

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-columns-view-widths-changed', false, undefined)
        }
    }

    /** @internal */
    private processHorizontalScrollViewportStartChangedEvent() {
        this._descendantEventer.horizontalScrollViewportStartChanged();

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-horizontal-scroll-viewport-changed', false, undefined);
        }
    }

    /** @internal */
    private processVerticalScrollViewportStartChangedEvent() {
        this._descendantEventer.verticalScrollViewportStartChanged();

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-vertical-scroll-viewport-changed', false, undefined);
        }
    }

    /** @internal */
    private processFocusEvent(event: FocusEvent) {
        this._descendantEventer.focus(event);
    }

    /** @internal */
    private processBlurEvent(event: FocusEvent) {
        this._descendantEventer.blur(event);
    }

    /** @internal */
    private processKeyDownEvent(event: EventDetail.Keyboard) {
        this.uiKeyDownEventer(event);

        this._descendantEventer.keyDown(event);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-key-down', false, event);
        }
    }

    /** @internal */
    private processKeyUpEvent(event: EventDetail.Keyboard) {
        this.uiKeyUpEventer(event);

        this._descendantEventer.keyUp(event);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-key-up', false, event);
        }
    }

    /** @internal */
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

    /** @internal */
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

    /** @internal */
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

    /** @internal */
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

    /** @internal */
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

    /** @internal */
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

    /** @internal */
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

    /** @internal */
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

    /** @internal */
    private processDragStartEvent(event: DragEvent) {
        this._descendantEventer.dragStart(event); // give descendant a chance to claim drag start
    }

    /** @internal */
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

    /** @internal */
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

    /** @internal */
    private processPointerDragEvent(event: PointerEvent, internal: boolean) {
        if (internal) {
            this.uiPointerDragEventer(event);
        } else {
            this._descendantEventer.pointerDrag(event);
        }
    }

    /** @internal */
    private processPointerDragEndEvent(event: PointerEvent, internal: boolean) {
        if (internal) {
            this.uiPointerDragEndEventer(event);
        } else {
            this._descendantEventer.pointerDragEnd(event);
        }
    }

    /** @internal */
    private processTouchStartEvent(event: TouchEvent) {
        this.uiTouchStartEventer(event);

        this._descendantEventer.touchStart(event);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-touch-start', false, event);
        }
    }

    /** @internal */
    private processTouchMoveEvent(event: TouchEvent) {
        this.uiTouchMoveEventer(event);

        this._descendantEventer.touchMove(event);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-touch-move', false, event);
        }
    }

    /** @internal */
    private processTouchEndEvent(event: TouchEvent) {
        this.uiTouchEndEventer(event);

        this._descendantEventer.touchEnd(event);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-touch-end', false, event);
        }
    }

    /** @internal */
    private processCopyEvent(event: ClipboardEvent) {
        this.uiCopyEventer(event);

        this._descendantEventer.copy(event);
    }

    /** @internal */
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

    /** @internal */
    private processSelectionChangedEvent() {
        this._descendantEventer.selectionChanged();

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-selection-changed', false, undefined);
        }
    }

    /** @internal */
    private processHorizontalScrollerEvent(action: EventDetail.ScrollerAction) {
        this.uiHorizontalScrollerActionEventer(action);

        this._descendantEventer.horizontalScrollerAction(action);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-horizontal-scroller-action', false, action);
        }
    }

    /** @internal */
    private processVerticalScrollerEvent(action: EventDetail.ScrollerAction) {
        this.uiVerticalScrollerActionEventer(action);

        this._descendantEventer.verticalScrollerAction(action);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-vertical-scroller-action', false, action);
        }
    }

    /** @internal */
    private processMouseEnteredCellEvent(cell: ViewCell<BCS>) {
        this._descendantEventer.mouseEnteredCell(cell);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-cell-enter', false, cell);
        }
    }

    /** @internal */
    private processMouseExitedCellEvent(cell: ViewCell<BCS>) {
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

    /** @internal */
    private dispatchCustomEvent<T extends EventName<BCS>>(
        eventName: T,
        cancelable: boolean,
        eventDetail: EventName.DetailMap<BCS>[T] | undefined,
    ): boolean {
        if (this._destroyed) {
            return false;
        } else {
            const eventInit: CustomEventInit<EventName.DetailMap<BCS>[T]> = {
                detail: eventDetail,
                cancelable,
            };

            const event = new CustomEvent<EventName.DetailMap<BCS>[T]>(eventName, eventInit);

            return this._dispatchEventEventer(event);
        }
    }

    /** @internal */
    private dispatchMouseEvent<T extends EventName.Mouse>(eventName: T, event: MouseEvent | WheelEvent, cell: ViewCell<BCS> | null | undefined) {
        if (cell === null) {
            cell = undefined;
        } else {
            if (cell !== undefined) {
                cell = Object.create(cell) as HoverCell<BCS>; // clone cell
            }
        }
        const detail = event as EventName.DetailMap<BCS>[T];
        detail.revgridCell = cell;
        return this.dispatchCustomEvent(eventName, false, detail);
    }
}

/** @public */
export namespace EventBehavior {
    /** @internal */
    export type DispatchEventEventer = (this: void, event: Event) => boolean;

    /** @internal */
    export interface UiPointerDragStartResult<BCS extends BehavioredColumnSettings> {
        readonly started: boolean;
        readonly cell: HoverCell<BCS> | null | undefined;
    }

    /** @internal */
    export interface DescendantEventer<BCS extends BehavioredColumnSettings> {
        readonly allColumnListChanged: (this: void, typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined) => void;
        readonly activeColumnListChanged: (this: void, typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined, ui: boolean) => void;
        readonly columnsChanged: DescendantEventer.Signal;
        readonly columnsWidthChanged: (this: void, columns: Column<BCS>[], ui: boolean) => void;
        readonly columnsViewWidthsChanged: DescendantEventer.Signal;
        readonly columnSort: (this: void, event: MouseEvent, cell: ViewCell<BCS>) => void;
        readonly cellFocusChanged: DescendantEventer.CellFocusChanged;
        readonly selectionChanged: DescendantEventer.Signal;
        readonly focus: DescendantEventer.Focus;
        readonly blur: DescendantEventer.Focus;
        readonly keyDown: DescendantEventer.Key;
        readonly keyUp: DescendantEventer.Key;
        readonly click: DescendantEventer.Mouse<BCS>;
        readonly dblClick: DescendantEventer.Mouse<BCS>;
        readonly pointerEnter: DescendantEventer.Pointer<BCS>;
        readonly pointerDown: DescendantEventer.Pointer<BCS>;
        readonly pointerUpCancel: DescendantEventer.Pointer<BCS>;
        readonly pointerMove: DescendantEventer.Pointer<BCS>;
        readonly pointerLeaveOut: DescendantEventer.Pointer<BCS>;
        readonly wheelMove: DescendantEventer.Wheel<BCS>;
        readonly dragStart: DescendantEventer.Drag;
        readonly contextMenu: DescendantEventer.Mouse<BCS>;
        readonly pointerDragStart: DescendantEventer.PointerDragStart<BCS>;
        readonly pointerDrag: DescendantEventer.PointerDrag;
        readonly pointerDragEnd: DescendantEventer.PointerDrag;
        readonly rendered: DescendantEventer.Signal;
        readonly mouseEnteredCell: DescendantEventer.ViewCellOnly<BCS>;
        readonly mouseExitedCell: DescendantEventer.ViewCellOnly<BCS>;
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

    /** @internal */
    export namespace DescendantEventer {
        export type Signal = (this: void) => void;
        export type Focus = (this: void, event: FocusEvent) => void;
        export type Key = (this: void, event: EventDetail.Keyboard) => void;
        export type Mouse<BCS extends BehavioredColumnSettings> = (this: void, event: MouseEvent, cell: HoverCell<BCS> | null | undefined) => void;
        export type Pointer<BCS extends BehavioredColumnSettings> = (this: void, event: PointerEvent, cell: HoverCell<BCS> | null | undefined) => void;
        export type PointerDrag = (this: void, event: PointerEvent) => void;
        export type PointerDragStart<BCS extends BehavioredColumnSettings> = (this: void, event: DragEvent, cell: HoverCell<BCS> | null | undefined) => boolean; // This is not a typo. Drag event has the correct mouse down location
        export type Wheel<BCS extends BehavioredColumnSettings> = (this: void, event: WheelEvent, cell: HoverCell<BCS> | null | undefined) => void;
        export type DragCell<BCS extends BehavioredColumnSettings> = (this: void, event: DragEvent, cell: HoverCell<BCS> | null | undefined) => void;
        export type Drag = (this: void, event: DragEvent) => void;
        export type Touch = (this: void, event: TouchEvent) => void;
        export type ViewCellOnly<BCS extends BehavioredColumnSettings> = (this: void, cell: ViewCell<BCS>) => void;
        export type Clipboard = (this: void, event: ClipboardEvent) => void;
        export type ScrollerAction = (this: void, event: EventDetail.ScrollerAction) => void;
        export type CellFocusChanged = (this: void, oldPoint: Point | undefined, newPoint: Point | undefined) => void;
    }

    /** @internal */
    export type UiKeyEventer = (this: void, keyboardEvent: EventDetail.Keyboard) => void;
    /** @internal */
    export type UiMouseEventer<BCS extends BehavioredColumnSettings> = (this: void, pointerEvent: EventDetail.Mouse<BCS>) => HoverCell<BCS> | null | undefined;
    /** @internal */
    export type UiPointerEventer<BCS extends BehavioredColumnSettings> = (this: void, pointerEvent: EventDetail.Pointer<BCS>) => HoverCell<BCS> | null | undefined;
    /** @internal */
    export type UiPointerDragEventer<BCS extends BehavioredColumnSettings> = (this: void, pointerEvent: EventDetail.Pointer<BCS>) => void;
    /** @internal */
    export type UiPointerDragStartEventer<BCS extends BehavioredColumnSettings> = (this: void, dragEvent: DragEvent) => UiPointerDragStartResult<BCS>;
    /** @internal */
    export type UiWheelEventer<BCS extends BehavioredColumnSettings> = (this: void, wheelEvent: EventDetail.Wheel<BCS>) => HoverCell<BCS> | null | undefined;
    /** @internal */
    export type UiDragEventer<BCS extends BehavioredColumnSettings> = (this: void, event: DragEvent) => HoverCell<BCS> | null | undefined;
    /** @internal */
    export type UiTouchEventer = (this: void, touchEvent: TouchEvent) => void;
    /** @internal */
    export type UiClipboardEventer = (this: void, clipboardEvent: ClipboardEvent) => void;
    /** @internal */
    export type UiScrollerActionEventer = (this: void, action: EventDetail.ScrollerAction) => void;
}
