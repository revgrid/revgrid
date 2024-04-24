import { CellPropertiesBehavior } from '../behavior/cell-properties-behavior';
import { DataExtractBehavior } from '../behavior/data-extract-behavior';
import { EventBehavior } from '../behavior/event-behavior';
import { FocusScrollBehavior } from '../behavior/focus-scroll-behavior';
import { FocusSelectBehavior } from '../behavior/focus-select-behavior';
import { ReindexBehavior } from '../behavior/reindex-behavior';
import { RowPropertiesBehavior } from '../behavior/row-properties-behavior';
import { Canvas } from '../components/canvas/canvas';
import { ColumnsManager } from '../components/column/columns-manager';
import { Focus } from '../components/focus/focus';
import { Mouse } from '../components/mouse/mouse';
import { Renderer } from '../components/renderer/renderer';
import { Scroller } from '../components/scroller/scroller';
import { Selection } from '../components/selection/selection';
import { SubgridsManager } from '../components/subgrid/subgrids-manager';
import { ViewLayout } from '../components/view/view-layout';
import { LinedHoverCell } from '../interfaces/data/hover-cell';
import { SchemaField } from '../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../interfaces/settings/behaviored-grid-settings';
import { RevClientObject } from '../types-utils/client-object';
import { RevAssertError } from '../types-utils/revgrid-error';
import { CellClickUiController } from './controller/cell-click-ui-controller';
import { ClipboardUiController } from './controller/clipboard-ui-controller';
import { ColumnMovingUiController } from './controller/column-moving-ui-controller';
import { ColumnResizingUiController } from './controller/column-resizing-ui-controller';
import { ColumnSortingUiController } from './controller/column-sorting-ui-controller';
import { UiControllerServices } from './controller/common/ui-controller-services';
import { UiControllerSharedState } from './controller/common/ui-controller-shared-state';
import { FiltersUiController } from './controller/filters-ui-controller';
import { FocusScrollUiController } from './controller/focus-scroll-ui-controller';
import { HoverUiController } from './controller/hover-ui-controller';
import { RowResizingUiController } from './controller/row-resizing-ui-controller';
import { SelectionUiController } from './controller/selection-ui-controller';
import { TouchScrollingUiController } from './controller/touch-scrolling-ui-controller';
import { UiController } from './controller/ui-controller';
import { UiControllerFactory } from './ui-controller-factory';

/** @public */
export class UiManager<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> implements RevClientObject {
    /** @internal */
    private readonly _uiControllerFactory = new UiControllerFactory<BGS, BCS, SF>();
    /** @internal */
    private readonly _uiControllerMap = new Map<string, UiController<BGS, BCS, SF>>();
    /** @internal */
    private readonly _sharedState: UiControllerSharedState; // Will be initialised in constructor
    /** @internal */
    private readonly _services: UiControllerServices<BGS, BCS, SF>;

    /** @internal */
    private _firstUiController: UiController<BGS, BCS, SF>;
    /** @internal */
    private _enabled = false;

    /** @internal */
    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        hostElement: HTMLElement,
        private readonly _gridSettings: BGS,
        canvas: Canvas<BGS>,
        focus: Focus<BGS, BCS, SF>,
        selection: Selection<BGS, BCS, SF>,
        columnsManager: ColumnsManager<BCS, SF>,
        subgridsManager: SubgridsManager<BCS, SF>,
        viewLayout: ViewLayout<BGS, BCS, SF>,
        renderer: Renderer<BGS, BCS, SF>,
        private readonly _mouse: Mouse<BGS, BCS, SF>,
        horizontalScroller: Scroller<BGS, BCS, SF>,
        verticalScroller: Scroller<BGS, BCS, SF>,
        focusScrollBehavior: FocusScrollBehavior<BGS, BCS, SF>,
        selectionBehavior: FocusSelectBehavior<BGS, BCS, SF>,
        rowPropertiesBehavior: RowPropertiesBehavior<BGS, BCS, SF>,
        cellPropertiesBehavior: CellPropertiesBehavior<BGS, BCS, SF>,
        dataExtractBehavior: DataExtractBehavior<BGS, BCS, SF>,
        reindexBehavior: ReindexBehavior<BGS, BCS, SF>,
        private readonly _eventBehavior: EventBehavior<BGS, BCS, SF>,
        customUiControllerDefinitions: UiController.Definition<BGS, BCS, SF>[] | undefined,
    ) {
        this._sharedState = {
            locationCursorName: undefined,
            locationTitleText: undefined,
        };

        this._services = new UiControllerServices(
            this.clientId,
            this.internalParent,
            this._sharedState,
            hostElement,
            this._gridSettings,
            canvas,
            selection,
            focus,
            columnsManager,
            subgridsManager,
            viewLayout,
            renderer,
            this._mouse,
            horizontalScroller,
            verticalScroller,
            reindexBehavior,
            focusScrollBehavior,
            selectionBehavior,
            rowPropertiesBehavior,
            cellPropertiesBehavior,
            dataExtractBehavior,
            this._eventBehavior,
        );

        this._firstUiController = this.createAndLinkUiControllers(customUiControllerDefinitions);

        this._eventBehavior.uiKeyDownEventer = (event, fromEditor) => { this.handleKeyDownEvent(event, fromEditor); };
        this._eventBehavior.uiKeyUpEventer = (event) => { this.handleKeyUpEvent(event); };
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
        this._eventBehavior.uiTouchStartEventer = (event) => { this.handleTouchStartEvent(event); };
        this._eventBehavior.uiTouchMoveEventer = (event) => { this.handleTouchMoveEvent(event); };
        this._eventBehavior.uiTouchEndEventer = (event) => { this.handleTouchEndEvent(event); };
        this._eventBehavior.uiCopyEventer = (event) => { this.handleCopyEvent(event); };
        this._eventBehavior.uiHorizontalScrollerActionEventer = (event) => { this.handleHorizontalScrollerActionEvent(event); };
        this._eventBehavior.uiVerticalScrollerActionEventer = (event) => { this.handleVerticalScrollerActionEvent(event); };
    }

    load(customUiControllerDefinitions: UiController.Definition<BGS, BCS, SF>[] | undefined) {
        this._firstUiController = this.createAndLinkUiControllers(customUiControllerDefinitions);
        return this._firstUiController;
    }

    enable() {
        this._enabled = true;
    }

    disable() {
        this._enabled = false;
    }

    lookupFeature(key: string) {
        return this._uiControllerMap.get(key);
    }

    /**
     * delegate handling key down to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handleKeyDownEvent(eventDetail: KeyboardEvent, fromEditor: boolean) {
        if (this._enabled) {
            this._firstUiController.handleKeyDown(eventDetail, fromEditor);
        }
    }

    /**
     * delegate handling key up to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handleKeyUpEvent(event: KeyboardEvent) {
        if (this._enabled) {
            this._firstUiController.handleKeyUp(event);
        }
    }

    /**
     * delegate handling mouse move to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handlePointerMoveEvent(event: PointerEvent): LinedHoverCell<BCS, SF> | null | undefined {
        if (this._enabled) {
            this._sharedState.locationCursorName = undefined;
            this._sharedState.locationTitleText = undefined;
            const cell = this._firstUiController.handlePointerMove(event, null);
            this._mouse.setLocation(this._sharedState.locationCursorName, this._sharedState.locationTitleText);
            return cell;
        } else {
            return null;
        }
    }

    /**
     * delegate handling tap to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handleClickEvent(event: MouseEvent): LinedHoverCell<BCS, SF> | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiController.handleClick(event, null);
            return cell;
        } else {
            return null;
        }
    }

    /**
     * delegate handling tap to the feature chain of responsibility
     * @internal
     */
    private handleContextMenuEvent(event: MouseEvent): LinedHoverCell<BCS, SF> | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiController.handleContextMenu(event, null);
            return cell;
        } else {
            return null;
        }
    }

    /**
     * delegate handling wheel moved to the feature chain of responsibility
     * @internal
     */
    private handleWheelMovedEvent(event: WheelEvent): LinedHoverCell<BCS, SF> | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiController.handleWheelMove(event, null);
            return cell;
        } else {
            return null;
        }
    }

    /**
     * delegate handling mouse up to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handlePointerUpCancelEvent(event: PointerEvent): LinedHoverCell<BCS, SF> | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiController.handlePointerUpCancel(event, null);
            return cell;
        } else {
            return null;
        }
    }

    /** @internal */
    private handlePointerDragStartEvent(event: DragEvent): EventBehavior.UiPointerDragStartResult<BCS, SF> {
        if (this._enabled) {
            return this._firstUiController.handlePointerDragStart(event, null);
        } else {
            return {
                started: false,
                hoverCell: undefined,
            };
        }
    }

    /** @internal */
    private handlePointerDragEvent(event: PointerEvent): LinedHoverCell<BCS, SF> | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiController.handlePointerDrag(event, null);
            return cell;
        } else {
            return null;
        }
    }

    /** @internal */
    private handlePointerDragEndEvent(event: PointerEvent): LinedHoverCell<BCS, SF> | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiController.handlePointerDragEnd(event, null);
            return cell;
        } else {
            return null;
        }
    }

    /**
     * delegate handling double click to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handleDblClickEvent(event: MouseEvent): LinedHoverCell<BCS, SF> | null | undefined {
        if (this._enabled) {
            this._sharedState.locationCursorName = undefined;
            this._sharedState.locationTitleText = undefined;
            const cell = this._firstUiController.handleDblClick(event, null);
            this._mouse.setLocation(this._sharedState.locationCursorName, this._sharedState.locationTitleText);
            return cell;
        } else {
            return null;
        }
    }
    /**
     * delegate handling mouse down to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handlePointerDownEvent(event: PointerEvent): LinedHoverCell<BCS, SF> | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiController.handlePointerDown(event, null);
            return cell;
        } else {
            return null;
        }
    }

    /**
     * delegate handling mouse exit to the feature chain of responsibility
     * @internal
     */
    private handlePointerEnterEvent(event: PointerEvent): LinedHoverCell<BCS, SF> | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiController.handlePointerEnter(event, null);
            return cell;
        } else {
            return null;
        }
    }

    /**
     * delegate handling mouse exit to the feature chain of responsibility
     * @internal
     */
    private handlePointerLeaveOutEvent(event: PointerEvent): LinedHoverCell<BCS, SF> | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiController.handlePointerLeaveOut(event, null);
            return cell;
        } else {
            return null;
        }
    }

    /**
     * Delegate handling touchstart to the feature chain of responsibility.
     * @internal
     */
    private handleTouchStartEvent(eventDetail: TouchEvent) {
        if (this._enabled) {
            this._firstUiController.handleTouchStart(eventDetail);
        }
    }

    /**
     * Delegate handling touchmove to the feature chain of responsibility.
     * @internal
     */
    private handleTouchMoveEvent(eventDetail: TouchEvent) {
        if (this._enabled) {
            this._firstUiController.handleTouchMove(eventDetail);
        }
    }

    /**
     * Delegate handling touchend to the feature chain of responsibility.
     * @internal
     */
    private handleTouchEndEvent(eventDetail: TouchEvent) {
        if (this._enabled) {
            this._firstUiController.handleTouchEnd(eventDetail);
        }
    }

    /**
     * Delegate handling touchend to the feature chain of responsibility.
     * @internal
     */
    private handleCopyEvent(eventDetail: ClipboardEvent) {
        if (this._enabled) {
            this._firstUiController.handleCopy(eventDetail);
        }
    }

    /** @internal */
    private handleHorizontalScrollerActionEvent(eventDetail: Scroller.Action) {
        if (this._enabled) {
            this._firstUiController.handleHorizontalScrollerAction(eventDetail);
        }
    }

    /** @internal */
    private handleVerticalScrollerActionEvent(eventDetail: Scroller.Action) {
        if (this._enabled) {
            this._firstUiController.handleVerticalScrollerAction(eventDetail);
        }
    }

    /** @internal */
    private createAndLinkUiControllers(customUiControllerDefinitions: UiController.Definition<BGS, BCS, SF>[] | undefined) {
        /**
         * Controller chain of command.
         * @remarks Each feature is linked to the next feature.
         */

        /**
         * Hash of instantiated features by class names.
         * @remarks Built here but otherwise not in use.
         */

        this._uiControllerFactory.registerDefinition(FocusScrollUiController.typeName, FocusScrollUiController);
        this._uiControllerFactory.registerDefinition(CellClickUiController.typeName, CellClickUiController);
        this._uiControllerFactory.registerDefinition(SelectionUiController.typeName, SelectionUiController);
        this._uiControllerFactory.registerDefinition(ColumnMovingUiController.typeName, ColumnMovingUiController);
        this._uiControllerFactory.registerDefinition(ColumnResizingUiController.typeName, ColumnResizingUiController);
        this._uiControllerFactory.registerDefinition(ColumnSortingUiController.typeName, ColumnSortingUiController);
        this._uiControllerFactory.registerDefinition(FiltersUiController.typeName, FiltersUiController);
        this._uiControllerFactory.registerDefinition(HoverUiController.typeName, HoverUiController);
        this._uiControllerFactory.registerDefinition(RowResizingUiController.typeName, RowResizingUiController);
        this._uiControllerFactory.registerDefinition(TouchScrollingUiController.typeName, TouchScrollingUiController);
        this._uiControllerFactory.registerDefinition(ClipboardUiController.typeName, ClipboardUiController);
        if (customUiControllerDefinitions !== undefined) {
            for (const { typeName, constructor } of customUiControllerDefinitions) {
                this._uiControllerFactory.registerDefinition(typeName, constructor);
            }
        }

        const typeNames = this._gridSettings.defaultUiControllerTypeNames;
        const maxCount = typeNames.length;
        const uiControllers = new Array<UiController<BGS, BCS, SF>>(maxCount);
        let count = 0;
        for (let i = 0; i < maxCount; i++) {
            const name = typeNames[i];
            const uiController = this._uiControllerFactory.create(name, this._services);
            if (uiController === undefined) {
                throw new RevAssertError('UBMLR23098', `UiController not registered: ${name}`);
            } else {
                uiControllers[count++] = uiController;
            }
        }

        if (count === 0) {
            throw new RevAssertError('UBMLZ23098', 'Zero UiControllers specified in Grid Settings (require at least one)');
        } else {
            const firstUiController = uiControllers[0];
            let previousUiController = firstUiController;
            for (let i = 1; i < count; i++) {
                const uiController = uiControllers[i];
                previousUiController.setNext(uiController);
                previousUiController = uiController;
            }

            UiControllerSharedState.initialise(this._sharedState);
            firstUiController.initialise();

            return firstUiController;
        }
    }
}
