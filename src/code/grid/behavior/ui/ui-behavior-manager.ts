import { CanvasManager } from '../../components/canvas/canvas-manager';
import { ColumnsManager } from '../../components/column/columns-manager';
import { EventDetail } from '../../components/event/event-detail';
import { Focus } from '../../components/focus/focus';
import { Mouse } from '../../components/mouse/mouse';
import { Renderer } from '../../components/renderer/renderer';
import { Selection } from '../../components/selection/selection';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../components/view/view-layout';
import { ViewCell } from '../../interfaces/data/view-cell';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { CellPropertiesBehavior } from '../component/cell-properties-behavior';
import { DataExtractBehavior } from '../component/data-extract-behavior';
import { EventBehavior } from '../component/event-behavior';
import { FocusScrollBehavior } from '../component/focus-scroll-behavior';
import { FocusSelectBehavior } from '../component/focus-select-behavior';
import { ReindexBehavior } from '../component/reindex-behavior';
import { RowPropertiesBehavior } from '../component/row-properties-behavior';
import { UiBehavior } from './ui-behavior';
import { UiBehaviorFactory } from './ui-behavior-factory';
import { UiBehaviorServices } from './ui-behavior-services';
import { UiBehaviorSharedState } from './ui-behavior-shared-state';

/** @internal */
export class UiBehaviorManager {
    private _uiBehaviorMap = new Map<string, UiBehavior>();
    private _firstUiBehavior: UiBehavior;
    private _enabled = false;

    readonly _sharedState: UiBehaviorSharedState; // Will be initialised in constructor
    readonly _services: UiBehaviorServices;

    constructor(
        containerHtmlElement: HTMLElement,
        private readonly _gridSettings: GridSettings,
        canvasManager: CanvasManager,
        focus: Focus,
        selection: Selection,
        columnsManager: ColumnsManager,
        subgridsManager: SubgridsManager,
        viewLayout: ViewLayout,
        renderer: Renderer,
        private readonly _mouse: Mouse,
        focusScrollBehavior: FocusScrollBehavior,
        selectionBehavior: FocusSelectBehavior,
        rowPropertiesBehavior: RowPropertiesBehavior,
        cellPropertiesBehavior: CellPropertiesBehavior,
        dataExtractBehavior: DataExtractBehavior,
        reindexBehavior: ReindexBehavior,
        private readonly _eventBehavior: EventBehavior,
    ) {
        this._sharedState = {} as UiBehaviorSharedState

        this._services = new UiBehaviorServices(
            this._sharedState,
            containerHtmlElement,
            this._gridSettings,
            canvasManager,
            selection,
            focus,
            columnsManager,
            subgridsManager,
            viewLayout,
            renderer,
            this._mouse,
            reindexBehavior,
            focusScrollBehavior,
            selectionBehavior,
            rowPropertiesBehavior,
            cellPropertiesBehavior,
            dataExtractBehavior,
            this._eventBehavior,
        );

        this.load();

        this._eventBehavior.uiKeyDownEventer = (event) => this.handleKeyDownEvent(event);
        this._eventBehavior.uiKeyUpEventer = (event) => this.handleKeyUpEvent(event);
        this._eventBehavior.uiClickEventer = (event) => this.handleClickEvent(event);
        this._eventBehavior.uiDblClickEventer = (event) => this.handleDblClickEvent(event);
        this._eventBehavior.uiPointerDownEventer = (event) => this.handlePointerDownEvent(event);
        this._eventBehavior.uiPointerUpCancelEventer = (event) => this.handlePointerUpCancelEvent(event);
        this._eventBehavior.uiPointerMoveEventer = (event) => this.handlePointerMoveEvent(event);
        this._eventBehavior.uiPointerEnterEventer = (event) => this.handlePointerEnterEvent(event);
        this._eventBehavior.uiPointerLeaveOutEventer = (event) => this.handlePointerLeaveOutEvent(event);
        this._eventBehavior.uiPointerDragStartEventer = (event) => this.handlePointerDragStartEvent(event);
        this._eventBehavior.uiPointerDragEventer = (event) => this.handlePointerDragEvent(event);
        this._eventBehavior.uiPointerDragEndEventer = (event) => this.handlePointerDragEndEvent(event);
        this._eventBehavior.uiWheelMoveEventer = (event) => this.handleWheelMovedEvent(event);
        this._eventBehavior.uiContextMenuEventer = (event) => this.handleContextMenuEvent(event);
        this._eventBehavior.uiTouchStartEventer = (event) => this.handleTouchStartEvent(event);
        this._eventBehavior.uiTouchMoveEventer = (event) => this.handleTouchMoveEvent(event);
        this._eventBehavior.uiTouchEndEventer = (event) => this.handleTouchEndEvent(event);
        this._eventBehavior.uiCopyEventer = (event) => this.handleCopyEvent(event);
        this._eventBehavior.uiDragEventer = (event) => this.handleDragEvent(event);
        this._eventBehavior.uiDragStartEventer = (event) => this.handleDragStartEvent(event);
        this._eventBehavior.uiDragEnterEventer = (event) => this.handleDragEnterEvent(event);
        this._eventBehavior.uiDragOverEventer = (event) => this.handleDragOverEvent(event);
        this._eventBehavior.uiDragLeaveEventer = (event) => this.handleDragLeaveEvent(event);
        this._eventBehavior.uiDragEndEventer = (event) => this.handleDragEndEvent(event);
        this._eventBehavior.uiDropEventer = (event) => this.handleDropEvent(event);
        this._eventBehavior.uiDocumentDragOverEventer = (event) => this.handleDocumentDragOverEvent(event);
        this._eventBehavior.uiHorizontalScrollerActionEventer = (event) => this.handleHorizontalScrollerActionEvent(event);
        this._eventBehavior.uiVerticalScrollerActionEventer = (event) => this.handleVerticalScrollerActionEvent(event);
    }

    load() {
        /**
         * @summary Controller chain of command.
         * @desc Each feature is linked to the next feature.
         */

        /**
         * @summary Hash of instantiated features by class names.
         * @desc Built here but otherwise not in use.
         */

        const featureNames = this._gridSettings.features;
        if (featureNames !== undefined) {
            const maxCount = featureNames.length;
            const features = new Array<UiBehavior>(maxCount);
            let count = 0;
            for (let i = 0; i < maxCount; i++) {
                const name = featureNames[i];
                const feature = UiBehaviorFactory.create(name, this._services);
                if (feature === undefined) {
                    console.warn(`Feature not registered: ${name}`);
                } else {
                    features[count++] = feature;
                }
            }

            features.forEach(
                (feature, i) => {
                    this._uiBehaviorMap.set(feature.typeName, feature);

                    if (i > 0) {
                        this._firstUiBehavior.setNext(feature);
                    } else {
                        this._firstUiBehavior = feature;
                    }
                }
            )
        }

        if (this._firstUiBehavior) {
            this._firstUiBehavior.initializeOn();
        }

        UiBehaviorSharedState.initialise(this._sharedState);
    }

    enable() {
        if (this._firstUiBehavior !== undefined) {
            this._enabled = true;
        }
    }

    disable() {
        this._enabled = false;
    }

    lookupFeature(key: string) {
        return this._uiBehaviorMap.get(key);
    }

    /**
     * @desc delegate handling key down to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handleKeyDownEvent(eventDetail: EventDetail.Keyboard) {
        if (this._enabled) {
            this._firstUiBehavior.handleKeyDown(eventDetail);
        }
    }

    /**
     * @desc delegate handling key up to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handleKeyUpEvent(eventDetail: EventDetail.Keyboard) {
        if (this._enabled) {
            this._firstUiBehavior.handleKeyUp(eventDetail);
        }
    }

    /**
     * @desc delegate handling mouse move to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handlePointerMoveEvent(event: PointerEvent): ViewCell | null | undefined {
        if (this._enabled) {
            this._sharedState.locationCursorName = undefined;
            const cell = this._firstUiBehavior.handlePointerMove(event, undefined);
            this._mouse.setLocationCursor(this._sharedState.locationCursorName);
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling tap to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handleClickEvent(event: MouseEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleClick(event, undefined);
            this._sharedState.mouseDownUpClickUsedForMoveOrResize = false;
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling tap to the feature chain of responsibility
     * @internal
     */
    private handleContextMenuEvent(event: MouseEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleContextMenu(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling wheel moved to the feature chain of responsibility
     * @internal
     */
    private handleWheelMovedEvent(event: WheelEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleWheelMove(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling mouse up to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handlePointerUpCancelEvent(event: PointerEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handlePointerUpCancel(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    private handlePointerDragStartEvent(event: DragEvent): EventBehavior.UiPointerDragStartResult {
        if (this._enabled) {
            return this._firstUiBehavior.handlePointerDragStart(event, undefined);
        } else {
            return {
                started: false,
                cell: undefined,
            };
        }
    }

    private handlePointerDragEvent(event: PointerEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handlePointerDrag(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    private handlePointerDragEndEvent(event: PointerEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handlePointerDragEnd(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling double click to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handleDblClickEvent(event: MouseEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleDblClick(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }
    /**
     * @desc delegate handling mouse down to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handlePointerDownEvent(event: PointerEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handlePointerDown(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling mouse exit to the feature chain of responsibility
     * @internal
     */
    private handlePointerEnterEvent(event: PointerEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handlePointerEnter(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling mouse exit to the feature chain of responsibility
     * @internal
     */
    private handlePointerLeaveOutEvent(event: PointerEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handlePointerLeaveOut(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    private handleDragEvent(event: DragEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleDrag(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    private handleDragStartEvent(event: DragEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleDragStart(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    private handleDragEnterEvent(event: DragEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleDragEnter(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    private handleDragOverEvent(event: DragEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleDragOver(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    private handleDragLeaveEvent(event: DragEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleDragLeave(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    private handleDragEndEvent(event: DragEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleDragEnd(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    private handleDropEvent(event: DragEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleDrop(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    private handleDocumentDragOverEvent(event: DragEvent) {
        if (this._enabled) {
            this._firstUiBehavior.handleDocumentDragOver(event);
        }
    }

    /**
     * @desc Delegate handling touchstart to the feature chain of responsibility.
     * @internal
     */
    private handleTouchStartEvent(eventDetail: TouchEvent) {
        if (this._enabled) {
            this._firstUiBehavior.handleTouchStart(eventDetail);
        }
    }

    /**
     * @desc Delegate handling touchmove to the feature chain of responsibility.
     * @internal
     */
    private handleTouchMoveEvent(eventDetail: TouchEvent) {
        if (this._enabled) {
            this._firstUiBehavior.handleTouchMove(eventDetail);
        }
    }

    /**
     * @desc Delegate handling touchend to the feature chain of responsibility.
     * @internal
     */
    private handleTouchEndEvent(eventDetail: TouchEvent) {
        if (this._enabled) {
            this._firstUiBehavior.handleTouchEnd(eventDetail);
        }
    }

    /**
     * @desc Delegate handling touchend to the feature chain of responsibility.
     * @internal
     */
    private handleCopyEvent(eventDetail: ClipboardEvent) {
        if (this._enabled) {
            this._firstUiBehavior.handleCopy(eventDetail);
        }
    }

    private handleHorizontalScrollerActionEvent(eventDetail: EventDetail.ScrollerAction) {
        if (this._enabled) {
            this._firstUiBehavior.handleHorizontalScrollerAction(eventDetail);
        }
    }

    private handleVerticalScrollerActionEvent(eventDetail: EventDetail.ScrollerAction) {
        if (this._enabled) {
            this._firstUiBehavior.handleVerticalScrollerAction(eventDetail);
        }
    }
}
