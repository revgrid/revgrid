import { RevAssertError, RevClientObject, RevDataServer, RevListChangedTypeId, RevPoint, RevSchemaField } from '../../common/internal-api';
import { RevCanvas } from '../components/canvas/canvas';
import { RevColumnsManager } from '../components/column/columns-manager';
import { RevDispatchableEvent } from '../components/dispatchable-event/dispatchable-event';
import { RevFocus } from '../components/focus/focus';
import { RevMouse } from '../components/mouse/mouse';
import { RevRenderer } from '../components/renderer/renderer';
import { RevScroller } from '../components/scroller/scroller';
import { RevSelection } from '../components/selection/selection';
import { RevViewLayout } from '../components/view/view-layout';
import { RevLinedHoverCell } from '../interfaces/data/lined-hover-cell';
import { RevViewCell } from '../interfaces/data/view-cell';
import { RevColumn } from '../interfaces/dataless/column';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../settings/internal-api';

/** @public */
export class RevEventBehavior<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    /** @internal */
    uiKeyDownEventer: RevEventBehavior.UiKeyDownEventer;
    /** @internal */
    uiKeyUpEventer: RevEventBehavior.UiKeyEventer;
    /** @internal */
    uiClickEventer: RevEventBehavior.UiMouseEventer<BCS, SF>;
    /** @internal */
    uiDblClickEventer: RevEventBehavior.UiMouseEventer<BCS, SF>;
    /** @internal */
    uiPointerDownEventer: RevEventBehavior.UiPointerEventer<BCS, SF>;
    /** @internal */
    uiPointerUpCancelEventer: RevEventBehavior.UiPointerEventer<BCS, SF>;
    /** @internal */
    uiPointerMoveEventer: RevEventBehavior.UiPointerEventer<BCS, SF>;
    /** @internal */
    uiPointerEnterEventer: RevEventBehavior.UiPointerEventer<BCS, SF>;
    /** @internal */
    uiPointerLeaveOutEventer: RevEventBehavior.UiPointerEventer<BCS, SF>;
    /** @internal */
    uiPointerDragStartEventer: RevEventBehavior.UiPointerDragStartEventer<BCS, SF>;
    /** @internal */
    uiPointerDragEventer: RevEventBehavior.UiPointerDragEventer<BCS, SF>;
    /** @internal */
    uiPointerDragEndEventer: RevEventBehavior.UiPointerDragEventer<BCS, SF>;
    /** @internal */
    uiWheelMoveEventer: RevEventBehavior.UiWheelEventer<BCS, SF>;
    /** @internal */
    uiContextMenuEventer: RevEventBehavior.UiMouseEventer<BCS, SF>;
    /** @internal */
    uiTouchStartEventer: RevEventBehavior.UiTouchEventer;
    /** @internal */
    uiTouchMoveEventer: RevEventBehavior.UiTouchEventer;
    /** @internal */
    uiTouchEndEventer: RevEventBehavior.UiTouchEventer;
    /** @internal */
    uiCopyEventer: RevEventBehavior.UiClipboardEventer;
    /** @internal */
    uiHorizontalScrollerActionEventer: RevEventBehavior.UiScrollerActionEventer;
    /** @internal */
    uiVerticalScrollerActionEventer: RevEventBehavior.UiScrollerActionEventer;

    /** @internal */
    private readonly _dispatchEnabled: boolean;
    /** @internal */
    private _destroyed = false;

    /** @internal */
    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        dispatchEnabled: boolean,
        /** @internal */
        private readonly _canvas: RevCanvas<BGS>,
        /** @internal */
        private readonly _columnsManager: RevColumnsManager<BCS, SF>,
        /** @internal */
        private readonly _viewLayout: RevViewLayout<BGS, BCS, SF>,
        /** @internal */
        private readonly _focus: RevFocus<BGS, BCS, SF>,
        /** @internal */
        private readonly _selection: RevSelection<BGS, BCS, SF>,
        /** @internal */
        private readonly _mouse: RevMouse<BGS, BCS, SF>,
        /** @internal */
        private readonly _renderer: RevRenderer<BGS, BCS, SF>,
        /** @internal */
        private readonly _horizontalScroller: RevScroller<BGS, BCS, SF>,
        /** @internal */
        private readonly _verticalScroller: RevScroller<BGS, BCS, SF>,
        /** @internal */
        private readonly _descendantEventer: RevEventBehavior.DescendantEventer<BCS, SF>,
        /** @internal */
        private readonly _dispatchEventEventer: RevEventBehavior.DispatchEventEventer,
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
    processColumnSortEvent(event: MouseEvent, headerOrFixedRowCell: RevViewCell<BCS, SF>) {
        this._descendantEventer.columnSort(event, headerOrFixedRowCell);

        if (this._dispatchEnabled) {
            const hoverCell: RevLinedHoverCell<BCS, SF> = {
                viewCell: headerOrFixedRowCell,
                mouseOverLeftLine: false,
                mouseOverTopLine: false,
            }
            this.dispatchMouseHoverCellEvent('rev-column-sort', event, hoverCell);
        }
    }

    /** @internal */
    processDataServersRowListChanged(dataServers: RevDataServer<SF>[]) {
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
    private processFieldColumnListChangedEvent(typeId: RevListChangedTypeId, index: number, count: number, targetIndex: number | undefined) {
        this._descendantEventer.fieldColumnListChanged(typeId, index, count, targetIndex);
        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-field-column-list-changed', false, undefined);
        }
    }

    /** @internal */
    private processActiveColumnListChangedEvent(typeId: RevListChangedTypeId, index: number, count: number, targetIndex: number | undefined, ui: boolean) {
        this._descendantEventer.activeColumnListChanged(typeId, index, count, targetIndex, ui);
    }

    /** @internal */
    private processColumnsWidthChangedEvent(columns: RevColumn<BCS, SF>[], ui: boolean) {
        this._descendantEventer.columnsWidthChanged(columns, ui);
    }

    /** @internal */
    private processColumnsViewWidthsChangedEvent(changeds: RevViewLayout.ColumnsViewWidthChangeds) {
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
    private processCellFocusChangedEvent(newPoint: RevPoint | undefined, oldPoint: RevPoint | undefined) {
        this._descendantEventer.cellFocusChanged(newPoint, oldPoint);

        if (this._dispatchEnabled) {
            const detail: RevDispatchableEvent.Detail.CellFocusChanged = {
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
            const detail: RevDispatchableEvent.Detail.RowFocusChanged = {
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
    private processHorizontalScrollerEvent(action: RevScroller.Action) {
        this.uiHorizontalScrollerActionEventer(action);

        this._descendantEventer.horizontalScrollerAction(action);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-horizontal-scroller-action', false, action);
        }
    }

    /** @internal */
    private processVerticalScrollerEvent(action: RevScroller.Action) {
        this.uiVerticalScrollerActionEventer(action);

        this._descendantEventer.verticalScrollerAction(action);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-vertical-scroller-action', false, action);
        }
    }

    /** @internal */
    private processMouseEnteredCellEvent(cell: RevViewCell<BCS, SF>) {
        this._descendantEventer.mouseEnteredCell(cell);

        if (this._dispatchEnabled) {
            this.dispatchCustomEvent('rev-cell-enter', false, cell);
        }
    }

    /** @internal */
    private processMouseExitedCellEvent(cell: RevViewCell<BCS, SF>) {
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
    private dispatchCustomEvent<T extends RevDispatchableEvent.Name<BCS, SF>>(
        eventName: T,
        cancelable: boolean,
        eventDetail: RevDispatchableEvent.Name.DetailMap<BCS, SF>[T] | undefined,
    ): boolean {
        if (this._destroyed) {
            return false;
        } else {
            const eventInit: CustomEventInit<RevDispatchableEvent.Name.DetailMap<BCS, SF>[T]> = {
                detail: eventDetail,
                cancelable,
            };

            const event = new CustomEvent<RevDispatchableEvent.Name.DetailMap<BCS, SF>[T]>(eventName, eventInit);

            return this._dispatchEventEventer(event);
        }
    }

    /** @internal */
    private dispatchMouseHoverCellEvent<T extends RevDispatchableEvent.Name.MouseHoverCell>(eventName: T, event: MouseEvent | WheelEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        if (cell === null) {
            throw new RevAssertError('EVDMHCE50697');
        } else {
            if (cell !== undefined) {
                cell = {
                    viewCell: Object.create(cell.viewCell) as RevViewCell<BCS, SF>,
                    mouseOverLeftLine: cell.mouseOverLeftLine,
                    mouseOverTopLine: cell.mouseOverTopLine,
                }
            }
            const detail = event as RevDispatchableEvent.Name.DetailMap<BCS, SF>[T];
            detail.revgridHoverCell = cell;
            return this.dispatchCustomEvent(eventName, false, detail);
        }
    }
}

/** @public */
export namespace RevEventBehavior {
    /** @internal */
    export type DispatchEventEventer = (this: void, event: Event) => boolean;

    /** @internal */
    export interface UiPointerDragStartResult<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
        readonly started: boolean;
        readonly hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined;
    }

    /** @internal */
    export interface DescendantEventer<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
        readonly dataServersRowListChanged: (this: void, dataServers: RevDataServer<SF>[]) => void;
        readonly fieldColumnListChanged: (this: void, typeId: RevListChangedTypeId, index: number, count: number, targetIndex: number | undefined) => void;
        readonly activeColumnListChanged: (this: void, typeId: RevListChangedTypeId, index: number, count: number, targetIndex: number | undefined, ui: boolean) => void;
        readonly columnsWidthChanged: (this: void, columns: RevColumn<BCS, SF>[], ui: boolean) => void;
        readonly columnsViewWidthsChanged: (this: void, changeds: RevViewLayout.ColumnsViewWidthChangeds) => void;
        readonly columnSort: (this: void, event: MouseEvent, headerOrFixedRowCell: RevViewCell<BCS, SF>) => void;
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
        export type Mouse<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = (this: void, event: MouseEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined) => void;
        export type Pointer<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = (this: void, event: PointerEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined) => void;
        export type PointerDrag = (this: void, event: PointerEvent) => void;
        export type PointerDragStart<
            BCS extends RevBehavioredColumnSettings,
            SF extends RevSchemaField
        > = (this: void, event: DragEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined) => boolean; // This is not a typo. Drag event has the correct mouse down location
        export type Wheel<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = (this: void, event: WheelEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined) => void;
        export type DragCell<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = (this: void, event: DragEvent, cell: RevLinedHoverCell<BCS, SF> | null | undefined) => void;
        export type Drag = (this: void, event: DragEvent) => void;
        export type Touch = (this: void, event: TouchEvent) => void;
        export type ViewCellOnly<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = (this: void, cell: RevViewCell<BCS, SF>) => void;
        export type Clipboard = (this: void, event: ClipboardEvent) => void;
        export type ScrollerAction = (this: void, event: RevScroller.Action) => void;
        export type CellFocusChanged = (this: void, oldPoint: RevPoint | undefined, newPoint: RevPoint | undefined) => void;
        export type RowFocusChanged = (this: void, oldSubgridRowIndex: number | undefined, newSubgridRowIndex: number | undefined) => void;
    }

    /** @internal */
    export type UiKeyEventer = (this: void, keyboardEvent: KeyboardEvent) => void;
    /** @internal */
    export type UiKeyDownEventer = (this: void, keyboardEvent: KeyboardEvent, fromEditor: boolean) => void;
    /** @internal */
    export type UiMouseEventer<
        BCS extends RevBehavioredColumnSettings,
        SF extends RevSchemaField
    > = (this: void, pointerEvent: RevDispatchableEvent.Detail.Mouse<BCS, SF>) => RevLinedHoverCell<BCS, SF> | null | undefined;
    /** @internal */
    export type UiPointerEventer<
        BCS extends RevBehavioredColumnSettings,
        SF extends RevSchemaField
    > = (this: void, pointerEvent: RevDispatchableEvent.Detail.Pointer<BCS, SF>) => RevLinedHoverCell<BCS, SF> | null | undefined;
    /** @internal */
    export type UiPointerDragEventer<
        BCS extends RevBehavioredColumnSettings,
        SF extends RevSchemaField
    > = (this: void, pointerEvent: RevDispatchableEvent.Detail.Pointer<BCS, SF>) => void;
    /** @internal */
    export type UiPointerDragStartEventer<
        BCS extends RevBehavioredColumnSettings,
        SF extends RevSchemaField
    > = (this: void, dragEvent: DragEvent) => UiPointerDragStartResult<BCS, SF>;
    /** @internal */
    export type UiWheelEventer<
        BCS extends RevBehavioredColumnSettings,
        SF extends RevSchemaField
    > = (this: void, wheelEvent: RevDispatchableEvent.Detail.Wheel<BCS, SF>) => RevLinedHoverCell<BCS, SF> | null | undefined;
    /** @internal */
    export type UiDragEventer<
        BCS extends RevBehavioredColumnSettings,
        SF extends RevSchemaField
    > = (this: void, event: DragEvent) => RevLinedHoverCell<BCS, SF> | null | undefined;
    /** @internal */
    export type UiTouchEventer = (this: void, touchEvent: TouchEvent) => void;
    /** @internal */
    export type UiClipboardEventer = (this: void, clipboardEvent: ClipboardEvent) => void;
    /** @internal */
    export type UiScrollerActionEventer = (this: void, action: RevScroller.Action) => void;

    /** @internal */
    export function isSecondaryMouseButton(event: MouseEvent) {
        return event.button === 2;
    }
}
