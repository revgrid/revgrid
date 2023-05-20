import { CanvasEx } from '../../components/canvas-ex/canvas-ex';
import { ViewCell } from '../../components/cell/view-cell';
import { ColumnsManager } from '../../components/column/columns-manager';
import { EventDetail } from '../../components/event/event-detail';
import { Focus } from '../../components/focus/focus';
import { ReindexStashManager } from '../../components/model-callback-router/reindex-stash-manager';
import { Mouse } from '../../components/mouse/mouse';
import { Renderer } from '../../components/renderer/renderer';
import { Selection } from '../../components/selection/selection';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../components/view/view-layout';
import { GridSettings } from '../../interfaces/grid-settings';
import { CellPropertiesBehavior } from '../component/cell-properties-behavior';
import { DataExtractBehavior } from '../component/data-extract-behavior';
import { EventBehavior } from '../component/event-behavior';
import { FocusScrollBehavior } from '../component/focus-scroll-behavior';
import { RowPropertiesBehavior } from '../component/row-properties-behavior';
import { SelectionBehavior } from '../component/selection-behavior';
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
        canvasEx: CanvasEx,
        focus: Focus,
        selection: Selection,
        columnsManager: ColumnsManager,
        subgridsManager: SubgridsManager,
        viewLayout: ViewLayout,
        renderer: Renderer,
        reindexStashManager: ReindexStashManager,
        mouse: Mouse,
        focusScrollBehavior: FocusScrollBehavior,
        selectionBehavior: SelectionBehavior,
        rowPropertiesBehavior: RowPropertiesBehavior,
        cellPropertiesBehavior: CellPropertiesBehavior,
        dataExtractBehavior: DataExtractBehavior,
        private readonly _eventBehavior: EventBehavior,
    ) {
        this._sharedState = {} as UiBehaviorSharedState

        this._services = new UiBehaviorServices(
            this._sharedState,
            containerHtmlElement,
            this._gridSettings,
            canvasEx,
            selection,
            focus,
            columnsManager,
            subgridsManager,
            viewLayout,
            renderer,
            reindexStashManager,
            mouse,
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
        this._eventBehavior.uiMouseClickEventer = (event) => this.handleClickEvent(event);
        this._eventBehavior.uiMouseDblClickEventer = (event) => this.handleDoubleClickEvent(event);
        this._eventBehavior.uiMouseDownEventer = (event) => this.handleMouseDownEvent(event);
        this._eventBehavior.uiMouseUpEventer = (event) => this.handleMouseUpEvent(event);
        this._eventBehavior.uiMouseMoveEventer = (event) => this.handleMouseMoveEvent(event);
        this._eventBehavior.uiMouseDragEventer = (event) => this.handleMouseDragEvent(event);
        this._eventBehavior.uiMouseEnteredCellEventer = (event) => this.handleMouseEnteredCellEvent(event);
        this._eventBehavior.uiMouseExitedCellEventer = (event) => this.handleMouseExitedCellEvent(event);
        this._eventBehavior.uiWheelMoveEventer = (event) => this.handleWheelMovedEvent(event);
        this._eventBehavior.uiContextMenuEventer = (event) => this.handleContextMenuEvent(event);
        this._eventBehavior.uiTouchStartEventer = (event) => this.handleTouchStartEvent(event);
        this._eventBehavior.uiTouchMoveEventer = (event) => this.handleTouchMoveEvent(event);
        this._eventBehavior.uiTouchEndEventer = (event) => this.handleTouchEndEvent(event);
        this._eventBehavior.uiCopyEventer = (event) => this.handleCopyEvent(event);
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
    private handleMouseMoveEvent(event: MouseEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleMouseMove(event, undefined);
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
    private handleMouseUpEvent(event: MouseEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleMouseUp(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling mouse drag to the feature chain of responsibility
     * @internal
     */
    private handleMouseDragEvent(event: MouseEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleMouseDrag(event, undefined);
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
    private handleDoubleClickEvent(event: MouseEvent): ViewCell | null | undefined {
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
    private handleMouseDownEvent(event: MouseEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleMouseDown(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling mouse exit to the feature chain of responsibility
     * @internal
     */
    private handleMouseEnteredCellEvent(event: MouseEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleMouseEnter(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling mouse exit to the feature chain of responsibility
     * @internal
     */
    private handleMouseExitedCellEvent(event: MouseEvent): ViewCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleMouseExit(event, undefined);
            return cell;
        } else {
            return undefined;
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
