import { Canvas } from '../components/canvas/canvas';
import { ColumnsManager } from '../components/column/columns-manager';
import { DispatchableEvent } from '../components/dispatchable-event/dispatchable-event';
import { Focus } from '../components/focus/focus';
import { Mouse } from '../components/mouse/mouse';
import { Renderer } from '../components/renderer/renderer';
import { Scroller } from '../components/scroller/scroller';
import { Selection } from '../components/selection/selection';
import { ViewLayout } from '../components/view/view-layout';
import { DataServer } from '../interfaces/data/data-server';
import { LinedHoverCell } from '../interfaces/data/hover-cell';
import { ViewCell } from '../interfaces/data/view-cell';
import { Column } from '../interfaces/dataless/column';
import { SchemaField } from '../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../interfaces/settings/behaviored-grid-settings';
import { Point } from '../types-utils/point';
import { AssertError } from '../types-utils/revgrid-error';
import { RevgridObject } from '../types-utils/revgrid-object';
import { ListChangedTypeId } from '../types-utils/types';

/** @public */
export class EventBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> implements RevgridObject {
    /** @internal */
    uiKeyDownEventer: EventBehavior.UiKeyDownEventer;
    /** @internal */
    uiKeyUpEventer: EventBehavior.UiKeyEventer;
    /** @internal */
    uiClickEventer: EventBehavior.UiMouseEventer<BCS, SF>;
    /** @internal */
    uiDblClickEventer: EventBehavior.UiMouseEventer<BCS, SF>;
    /** @internal */
    uiPointerDownEventer: EventBehavior.UiPointerEventer<BCS, SF>;
    /** @internal */
    uiPointerUpCancelEventer: EventBehavior.UiPointerEventer<BCS, SF>;
    /** @internal */
    uiPointerMoveEventer: EventBehavior.UiPointerEventer<BCS, SF>;
    /** @internal */
    uiPointerEnterEventer: EventBehavior.UiPointerEventer<BCS, SF>;
    /** @internal */
    uiPointerLeaveOutEventer: EventBehavior.UiPointerEventer<BCS, SF>;
    /** @internal */
    uiPointerDragStartEventer: EventBehavior.UiPointerDragStartEventer<BCS, SF>;
    /** @internal */
    uiPointerDragEventer: EventBehavior.UiPointerDragEventer<BCS, SF>;
    /** @internal */
    uiPointerDragEndEventer: EventBehavior.UiPointerDragEventer<BCS, SF>;
    /** @internal */
    uiWheelMoveEventer: EventBehavior.UiWheelEventer<BCS, SF>;
    /** @internal */
    uiContextMenuEventer: EventBehavior.UiMouseEventer<BCS, SF>;
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
        readonly revgridId: string,
        readonly internalParent: RevgridObject,
        dispatchEnabled: boolean,
        /** @internal */
        private readonly _canvas: Canvas<BGS>,
        /** @internal */
        private readonly _columnsManager: ColumnsManager<BCS, SF>,
        /** @internal */
        private readonly _viewLayout: ViewLayout<BGS, BCS, SF>,
        /** @internal */
        private readonly _focus: Focus<BGS, BCS, SF>,
        /** @internal */
        private readonly _selection: Selection<BGS, BCS, SF>,
        /** @internal */
        private readonly _mouse: Mouse<BGS, BCS, SF>,
        /** @internal */
        private readonly _renderer: Renderer<BGS, BCS, SF>,
        /** @internal */
        private readonly _horizontalScroller: Scroller<BGS, BCS, SF>,
        /** @internal */
        private readonly _verticalScroller: Scroller<BGS, BCS, SF>,
        /** @internal */
        private readonly _descendantEventer: EventBehavior.DescendantEventer<BCS, SF>,
        /** @internal */
        private readonly _dispatchEventEventer: EventBehavior.DispatchEventEventer,
    ) {
        this._dispatchEnabled = dispatchEnabled;

        this._canvas.resizedEventerForEventBehavior = () => { this.processCanvasResizedEvent(); };

        this._canvas.focusEventer = (event) => { this.processFocusEvent(event); };
        this._canvas.blurEventer = (event) => { this.processBlurEvent(event); };
        this._canvas.keyDownEventer = (event) => { this.processKeyDownEvent(event, false); };
        this._canvas.keyUpEventer = (event) => { this.processKeyUpEvent(event); };
        this._canvas.clickEventer = (event) => { this.processClickEvent(event); };
        this._canvas.dblClickEventer = (event) => { this.processDblClickEvent(event); };
        this._canvas.pointerEnterEventer = (event) => { this.processPointerEnterEvent(event); };
        this._canvas.pointerDownEventer = (event) => { this.processPointerDownEvent(event); };
        this._canvas.pointerUpCancelEventer = (event) => { this.processPointerUpCancelEvent(event); };
        this._canvas.pointerMoveEventer = (event) => { this.processPointerMoveEvent(event); };
        this._canvas.pointerLeaveOutEventer = (event) => { this.processPointerLeaveOutEvent(event); };
        this._canvas.pointerDragStartEventer = (event) => this.processPointerDragStartEvent(event);
        this._canvas.pointerDragEventer = (event, internal) => { this.processPointerDragEvent(event, internal); };
        this._canvas.pointerDragEndEventer = (event, internal) => { this.processPointerDragEndEvent(event, internal); };
        this._canvas.wheelMoveEventer = (event) => { this.processWheelMoveEvent(event); };
        this._canvas.contextMenuEventer = (event) => { this.processContextMenuEvent(event); };
        this._canvas.touchStartEventer = (event) => { this.processTouchStartEvent(event); };
        this._canvas.touchMoveEventer = (event) => { this.processTouchMoveEvent(event); };
        this._canvas.touchEndEventer = (event) => { this.processTouchEndEvent(event); };
        this._canvas.copyEventer = (event) => { this.processCopyEvent(event); };
        this._canvas.dragStartEventer = (event) => { this.processDragStartEvent(event); };

        this._columnsManager.fieldColumnListChangedEventer = (typeId, index, count, targetIndex) => {
            this.processFieldColumnListChangedEvent(typeId, index, count, targetIndex);
        };
        this._columnsManager.activeColumnListChangedEventer = (typeId, index, count, targetIndex, ui) => {
            this.processActiveColumnListChangedEvent(typeId, index, count, targetIndex, ui);
        };
        this._columnsManager.columnsWidthChangedEventer = (columns, ui) => { this.processColumnsWidthChangedEvent(columns, ui); };

        this._viewLayout.columnsViewWidthsChangedEventer = (changeds) => { this.processColumnsViewWidthsChangedEvent(changeds); };
        this._viewLayout.horizontalScrollDimension.eventBehaviorTargettedViewportStartChangedEventer = () => { this.processHorizontalScrollViewportStartChangedEvent(); };
        this._viewLayout.verticalScrollDimension.eventBehaviorTargettedViewportStartChangedEventer = () => { this.processVerticalScrollViewportStartChangedEvent(); };

        this._focus.currentCellChangedForEventBehaviorEventer = (newPoint, oldPoint) => { this.processCellFocusChangedEvent(newPoint, oldPoint); };
        this._focus.currentRowChangedForEventBehaviorEventer = (newSubgridRowIndex, oldSubgridRowIndex) => { this.processRowFocusChangedEvent(newSubgridRowIndex, oldSubgridRowIndex); };
        this._focus.editorKeyDownEventer = (event) => { this.processKeyDownEvent(event, true); };
        this._selection.changedEventerForEventBehavior = () => { this.processSelectionChangedEvent(); };

        this._mouse.cellEnteredEventer = (cell) => { this.processMouseEnteredCellEvent(cell); };
        this._mouse.cellExitedEventer = (cell) => { this.processMouseExitedCellEvent(cell); };

        this._renderer.renderedEventer = () => { this.processRenderedEvent(); };

        this._horizontalScroller.actionEventer = (action) => { this.processHorizontalScrollerEvent(action); };
        this._horizontalScroller.wheelEventer = (event) => { this.processWheelMoveEvent(event); }
        this._verticalScroller.actionEventer = (action) => { this.processVerticalScrollerEvent(action); };
        this._verticalScroller.wheelEventer = (event) => { this.processWheelMoveEvent(event); }
    }

    /** @internal */
    destroy() {
        this._destroyed = true;
    }

    /** @internal */
    processColumnSortEvent(event: MouseEvent, headerOrFixedRowCell: ViewCell<BCS, SF>) {
        this._descendantEventer.columnSort(event, headerOrFixedRowCell);

        if (this._dispatchEnabled) {
            const hoverCell: LinedHoverCell<BCS, SF> = {
                viewCell: headerOrFixedRowCell,
                mouseOverLeftLine: false,
                mouseOverTopLine: false,
            }
            this.dispatchMouseHoverCellEvent('rev-column-sort', event, hoverCell);
        }
    }

    /** @internal */
    processDataServersRowListChanged(dataServers: DataServer<SF>[]) {
        this._descendantEventer.dataServersRowListChanged(dataServers);
    }

    /** @internal */
    private processCanvasResizedEvent() {
        this._descendantEventer.resized();

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-grid-resized', false, undefined);
        }
    }

    /** @internal */
    private processFieldColumnListChangedEvent(typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined) {
        this._descendantEventer.fieldColumnListChanged(typeId, index, count, targetIndex);
        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-field-column-list-changed', false, undefined);
        }
    }

    /** @internal */
    private processActiveColumnListChangedEvent(typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined, ui: boolean) {
        this._descendantEventer.activeColumnListChanged(typeId, index, count, targetIndex, ui);
    }

    /** @internal */
    private processColumnsWidthChangedEvent(columns: Column<BCS, SF>[], ui: boolean) {
        this._descendantEventer.columnsWidthChanged(columns, ui);
    }

    /** @internal */
    private processColumnsViewWidthsChangedEvent(changeds: ViewLayout.ColumnsViewWidthChangeds) {
        this._descendantEventer.columnsViewWidthsChanged(changeds);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-columns-view-widths-changed', false, changeds);
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
    private processKeyDownEvent(event: KeyboardEvent, fromEditor: boolean) {
        this.uiKeyDownEventer(event, fromEditor);

        this._descendantEventer.keyDown(event, fromEditor);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-key-down', false, event);
        }
    }

    /** @internal */
    private processKeyUpEvent(event: KeyboardEvent) {
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
            if (cell === null) {
                cell = this._viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.click(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseHoverCellEvent('rev-click', event, cell);
        }
    }

    /** @internal */
    private processDblClickEvent(event: MouseEvent) {
        let cell = this.uiDblClickEventer(event);
        if (this._dispatchEnabled) {
            if (cell === null) {
                cell = this._viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.dblClick(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseHoverCellEvent('rev-dbl-click', event, cell);
        }
    }

    /** @internal */
    private processPointerEnterEvent(event: PointerEvent) {
        let cell = this.uiPointerEnterEventer(event);
        if (this._dispatchEnabled) {
            if (cell === null) {
                cell = this._viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.pointerEnter(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseHoverCellEvent('rev-pointer-enter', event, cell);
        }
    }

    /** @internal */
    private processPointerDownEvent(event: PointerEvent) {
        let cell = this.uiPointerDownEventer(event);
        if (this._dispatchEnabled) {
            if (cell === null) {
                cell = this._viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.pointerDown(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseHoverCellEvent('rev-pointer-down', event, cell);
        }
    }

    /** @internal */
    private processPointerUpCancelEvent(event: PointerEvent) {
        let cell = this.uiPointerUpCancelEventer(event);
        if (this._dispatchEnabled) {
            if (cell === null) {
                cell = this._viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.pointerUpCancel(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseHoverCellEvent('rev-pointer-up-cancel', event, cell);
        }
    }

    /** @internal */
    private processPointerMoveEvent(event: PointerEvent) {
        let cell = this.uiPointerMoveEventer(event);
        if (this._dispatchEnabled) {
            if (cell === null) {
                cell = this._viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.pointerMove(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseHoverCellEvent('rev-pointer-move', event, cell);
        }
    }

    /** @internal */
    private processPointerLeaveOutEvent(event: PointerEvent) {
        let cell = this.uiPointerLeaveOutEventer(event);
        if (this._dispatchEnabled) {
            if (cell === null) {
                cell = this._viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.pointerLeaveOut(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseHoverCellEvent('rev-pointer-leave-out', event, cell);
        }
    }

    /** @internal */
    private processWheelMoveEvent(event: WheelEvent) {
        let cell = this.uiWheelMoveEventer(event);
        if (this._dispatchEnabled) {
            if (cell === null) {
                cell = this._viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.wheelMove(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseHoverCellEvent('rev-wheel-move', event, cell);
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
            if (cell === null) {
                cell = this._viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
            }
        }

        this._descendantEventer.contextMenu(event, cell);

        if (this._dispatchEnabled) {
            this.dispatchMouseHoverCellEvent('rev-context-menu', event, cell);
        }
    }

    /** @internal */
    private processPointerDragStartEvent(event: DragEvent) {
        const result = this.uiPointerDragStartEventer(event);
        if (result.started) {
            return true; // internally started
        } else {
            // const cell = this.uiMouseDragStartEventer(event);
            const started = this._descendantEventer.pointerDragStart(event, result.hoverCell);
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
    private processCellFocusChangedEvent(newPoint: Point | undefined, oldPoint: Point | undefined) {
        this._descendantEventer.cellFocusChanged(newPoint, oldPoint);

        if (this._dispatchEnabled) {
            const detail: DispatchableEvent.Detail.CellFocusChanged = {
                oldPoint,
                newPoint,
            };

            this.dispatchCustomEvent('rev-cell-focus-changed', false, detail);
        }
    }

    /** @internal */
    private processRowFocusChangedEvent(newSubgridRowIndex: number | undefined, oldSubgridRowIndex: number | undefined) {
        this._descendantEventer.rowFocusChanged(newSubgridRowIndex, oldSubgridRowIndex);

        if (this._dispatchEnabled) {
            const detail: DispatchableEvent.Detail.RowFocusChanged = {
                newSubgridRowIndex,
                oldSubgridRowIndex,
            };

            this.dispatchCustomEvent('rev-row-focus-changed', false, detail);
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
    private processHorizontalScrollerEvent(action: Scroller.Action) {
        this.uiHorizontalScrollerActionEventer(action);

        this._descendantEventer.horizontalScrollerAction(action);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-horizontal-scroller-action', false, action);
        }
    }

    /** @internal */
    private processVerticalScrollerEvent(action: Scroller.Action) {
        this.uiVerticalScrollerActionEventer(action);

        this._descendantEventer.verticalScrollerAction(action);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-vertical-scroller-action', false, action);
        }
    }

    /** @internal */
    private processMouseEnteredCellEvent(cell: ViewCell<BCS, SF>) {
        this._descendantEventer.mouseEnteredCell(cell);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-cell-enter', false, cell);
        }
    }

    /** @internal */
    private processMouseExitedCellEvent(cell: ViewCell<BCS, SF>) {
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
    private dispatchCustomEvent<T extends DispatchableEvent.Name<BCS, SF>>(
        eventName: T,
        cancelable: boolean,
        eventDetail: DispatchableEvent.Name.DetailMap<BCS, SF>[T] | undefined,
    ): boolean {
        if (this._destroyed) {
            return false;
        } else {
            const eventInit: CustomEventInit<DispatchableEvent.Name.DetailMap<BCS, SF>[T]> = {
                detail: eventDetail,
                cancelable,
            };

            const event = new CustomEvent<DispatchableEvent.Name.DetailMap<BCS, SF>[T]>(eventName, eventInit);

            return this._dispatchEventEventer(event);
        }
    }

    /** @internal */
    private dispatchMouseHoverCellEvent<T extends DispatchableEvent.Name.MouseHoverCell>(eventName: T, event: MouseEvent | WheelEvent, cell: LinedHoverCell<BCS, SF> | null | undefined) {
        if (cell === null) {
            throw new AssertError('EVDMHCE50697');
        } else {
            if (cell !== undefined) {
                cell = {
                    viewCell: Object.create(cell.viewCell) as ViewCell<BCS, SF>,
                    mouseOverLeftLine: cell.mouseOverLeftLine,
                    mouseOverTopLine: cell.mouseOverTopLine,
                }
            }
            const detail = event as DispatchableEvent.Name.DetailMap<BCS, SF>[T];
            detail.revgridHoverCell = cell;
            return this.dispatchCustomEvent(eventName, false, detail);
        }
    }
}

/** @public */
export namespace EventBehavior {
    /** @internal */
    export type DispatchEventEventer = (this: void, event: Event) => boolean;

    /** @internal */
    export interface UiPointerDragStartResult<BCS extends BehavioredColumnSettings, SF extends SchemaField> {
        readonly started: boolean;
        readonly hoverCell: LinedHoverCell<BCS, SF> | null | undefined;
    }

    /** @internal */
    export interface DescendantEventer<BCS extends BehavioredColumnSettings, SF extends SchemaField> {
        readonly dataServersRowListChanged: (this: void, dataServers: DataServer<SF>[]) => void;
        readonly fieldColumnListChanged: (this: void, typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined) => void;
        readonly activeColumnListChanged: (this: void, typeId: ListChangedTypeId, index: number, count: number, targetIndex: number | undefined, ui: boolean) => void;
        readonly columnsWidthChanged: (this: void, columns: Column<BCS, SF>[], ui: boolean) => void;
        readonly columnsViewWidthsChanged: (this: void, changeds: ViewLayout.ColumnsViewWidthChangeds) => void;
        readonly columnSort: (this: void, event: MouseEvent, headerOrFixedRowCell: ViewCell<BCS, SF>) => void;
        readonly cellFocusChanged: DescendantEventer.CellFocusChanged;
        readonly rowFocusChanged: DescendantEventer.RowFocusChanged;
        readonly selectionChanged: DescendantEventer.Signal;
        readonly focus: DescendantEventer.Focus;
        readonly blur: DescendantEventer.Focus;
        readonly keyDown: DescendantEventer.KeyDown;
        readonly keyUp: DescendantEventer.Key;
        readonly click: DescendantEventer.Mouse<BCS, SF>;
        readonly dblClick: DescendantEventer.Mouse<BCS, SF>;
        readonly pointerEnter: DescendantEventer.Pointer<BCS, SF>;
        readonly pointerDown: DescendantEventer.Pointer<BCS, SF>;
        readonly pointerUpCancel: DescendantEventer.Pointer<BCS, SF>;
        readonly pointerMove: DescendantEventer.Pointer<BCS, SF>;
        readonly pointerLeaveOut: DescendantEventer.Pointer<BCS, SF>;
        readonly wheelMove: DescendantEventer.Wheel<BCS, SF>;
        readonly dragStart: DescendantEventer.Drag;
        readonly contextMenu: DescendantEventer.Mouse<BCS, SF>;
        readonly pointerDragStart: DescendantEventer.PointerDragStart<BCS, SF>;
        readonly pointerDrag: DescendantEventer.PointerDrag;
        readonly pointerDragEnd: DescendantEventer.PointerDrag;
        readonly rendered: DescendantEventer.Signal;
        readonly mouseEnteredCell: DescendantEventer.ViewCellOnly<BCS, SF>;
        readonly mouseExitedCell: DescendantEventer.ViewCellOnly<BCS, SF>;
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
        export type Key = (this: void, event: KeyboardEvent) => void;
        export type KeyDown = (this: void, event: KeyboardEvent, fromEditor: boolean) => void;
        export type Mouse<BCS extends BehavioredColumnSettings, SF extends SchemaField> = (this: void, event: MouseEvent, cell: LinedHoverCell<BCS, SF> | null | undefined) => void;
        export type Pointer<BCS extends BehavioredColumnSettings, SF extends SchemaField> = (this: void, event: PointerEvent, cell: LinedHoverCell<BCS, SF> | null | undefined) => void;
        export type PointerDrag = (this: void, event: PointerEvent) => void;
        export type PointerDragStart<
            BCS extends BehavioredColumnSettings,
            SF extends SchemaField
        > = (this: void, event: DragEvent, cell: LinedHoverCell<BCS, SF> | null | undefined) => boolean; // This is not a typo. Drag event has the correct mouse down location
        export type Wheel<BCS extends BehavioredColumnSettings, SF extends SchemaField> = (this: void, event: WheelEvent, cell: LinedHoverCell<BCS, SF> | null | undefined) => void;
        export type DragCell<BCS extends BehavioredColumnSettings, SF extends SchemaField> = (this: void, event: DragEvent, cell: LinedHoverCell<BCS, SF> | null | undefined) => void;
        export type Drag = (this: void, event: DragEvent) => void;
        export type Touch = (this: void, event: TouchEvent) => void;
        export type ViewCellOnly<BCS extends BehavioredColumnSettings, SF extends SchemaField> = (this: void, cell: ViewCell<BCS, SF>) => void;
        export type Clipboard = (this: void, event: ClipboardEvent) => void;
        export type ScrollerAction = (this: void, event: Scroller.Action) => void;
        export type CellFocusChanged = (this: void, oldPoint: Point | undefined, newPoint: Point | undefined) => void;
        export type RowFocusChanged = (this: void, oldSubgridRowIndex: number | undefined, newSubgridRowIndex: number | undefined) => void;
    }

    /** @internal */
    export type UiKeyEventer = (this: void, keyboardEvent: KeyboardEvent) => void;
    /** @internal */
    export type UiKeyDownEventer = (this: void, keyboardEvent: KeyboardEvent, fromEditor: boolean) => void;
    /** @internal */
    export type UiMouseEventer<
        BCS extends BehavioredColumnSettings,
        SF extends SchemaField
    > = (this: void, pointerEvent: DispatchableEvent.Detail.Mouse<BCS, SF>) => LinedHoverCell<BCS, SF> | null | undefined;
    /** @internal */
    export type UiPointerEventer<
        BCS extends BehavioredColumnSettings,
        SF extends SchemaField
    > = (this: void, pointerEvent: DispatchableEvent.Detail.Pointer<BCS, SF>) => LinedHoverCell<BCS, SF> | null | undefined;
    /** @internal */
    export type UiPointerDragEventer<
        BCS extends BehavioredColumnSettings,
        SF extends SchemaField
    > = (this: void, pointerEvent: DispatchableEvent.Detail.Pointer<BCS, SF>) => void;
    /** @internal */
    export type UiPointerDragStartEventer<
        BCS extends BehavioredColumnSettings,
        SF extends SchemaField
    > = (this: void, dragEvent: DragEvent) => UiPointerDragStartResult<BCS, SF>;
    /** @internal */
    export type UiWheelEventer<
        BCS extends BehavioredColumnSettings,
        SF extends SchemaField
    > = (this: void, wheelEvent: DispatchableEvent.Detail.Wheel<BCS, SF>) => LinedHoverCell<BCS, SF> | null | undefined;
    /** @internal */
    export type UiDragEventer<
        BCS extends BehavioredColumnSettings,
        SF extends SchemaField
    > = (this: void, event: DragEvent) => LinedHoverCell<BCS, SF> | null | undefined;
    /** @internal */
    export type UiTouchEventer = (this: void, touchEvent: TouchEvent) => void;
    /** @internal */
    export type UiClipboardEventer = (this: void, clipboardEvent: ClipboardEvent) => void;
    /** @internal */
    export type UiScrollerActionEventer = (this: void, action: Scroller.Action) => void;

    /** @internal */
    export function isSecondaryMouseButton(event: MouseEvent) {
        return event.button === 2;
    }
}
