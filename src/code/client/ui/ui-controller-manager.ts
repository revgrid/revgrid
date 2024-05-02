import { RevAssertError, RevClientObject, RevSchemaField } from '../../common/internal-api';
import { RevCellPropertiesBehavior } from '../behavior/cell-properties-behavior';
import { RevDataExtractBehavior } from '../behavior/data-extract-behavior';
import { RevEventBehavior } from '../behavior/event-behavior';
import { RevFocusScrollBehavior } from '../behavior/focus-scroll-behavior';
import { RevFocusSelectBehavior } from '../behavior/focus-select-behavior';
import { RevReindexBehavior } from '../behavior/reindex-behavior';
import { RevRowPropertiesBehavior } from '../behavior/row-properties-behavior';
import { RevCanvas } from '../components/canvas/canvas';
import { RevColumnsManager } from '../components/column/columns-manager';
import { RevFocus } from '../components/focus/focus';
import { RevMouse } from '../components/mouse/mouse';
import { RevRenderer } from '../components/renderer/renderer';
import { RevScroller } from '../components/scroller/scroller';
import { RevSelection } from '../components/selection/selection';
import { RevSubgridsManager } from '../components/subgrid/subgrids-manager';
import { RevViewLayout } from '../components/view/view-layout';
import { RevLinedHoverCell } from '../interfaces/data/lined-hover-cell';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../settings/internal-api';
import { RevCellClickUiController } from './controller/cell-click-ui-controller';
import { RevClipboardUiController } from './controller/clipboard-ui-controller';
import { RevColumnMovingUiController } from './controller/column-moving-ui-controller';
import { RevColumnResizingUiController } from './controller/column-resizing-ui-controller';
import { RevColumnSortingUiController } from './controller/column-sorting-ui-controller';
import { RevUiControllerServices, RevUiControllerSharedState } from './controller/common/internal-api';
import { RevFiltersUiController } from './controller/filters-ui-controller';
import { RevFocusScrollUiController } from './controller/focus-scroll-ui-controller';
import { RevHoverUiController } from './controller/hover-ui-controller';
import { RevRowResizingUiController } from './controller/row-resizing-ui-controller';
import { RevSelectionUiController } from './controller/selection-ui-controller';
import { RevTouchScrollingUiController } from './controller/touch-scrolling-ui-controller';
import { RevUiController } from './controller/ui-controller';
import { RevUiControllerFactory } from './ui-controller-factory';

/** @public */
export class RevUiManager<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    /** @internal */
    private readonly _uiControllerFactory = new RevUiControllerFactory<BGS, BCS, SF>();
    /** @internal */
    private readonly _uiControllerMap = new Map<string, RevUiController<BGS, BCS, SF>>();
    /** @internal */
    private readonly _sharedState: RevUiControllerSharedState; // Will be initialised in constructor
    /** @internal */
    private readonly _services: RevUiControllerServices<BGS, BCS, SF>;

    /** @internal */
    private _firstUiController: RevUiController<BGS, BCS, SF>;
    /** @internal */
    private _enabled = false;

    /** @internal */
    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        hostElement: HTMLElement,
        private readonly _gridSettings: BGS,
        canvas: RevCanvas<BGS>,
        focus: RevFocus<BGS, BCS, SF>,
        selection: RevSelection<BGS, BCS, SF>,
        columnsManager: RevColumnsManager<BCS, SF>,
        subgridsManager: RevSubgridsManager<BCS, SF>,
        viewLayout: RevViewLayout<BGS, BCS, SF>,
        renderer: RevRenderer<BGS, BCS, SF>,
        private readonly _mouse: RevMouse<BGS, BCS, SF>,
        horizontalScroller: RevScroller<BGS, BCS, SF>,
        verticalScroller: RevScroller<BGS, BCS, SF>,
        focusScrollBehavior: RevFocusScrollBehavior<BGS, BCS, SF>,
        selectionBehavior: RevFocusSelectBehavior<BGS, BCS, SF>,
        rowPropertiesBehavior: RevRowPropertiesBehavior<BGS, BCS, SF>,
        cellPropertiesBehavior: RevCellPropertiesBehavior<BGS, BCS, SF>,
        dataExtractBehavior: RevDataExtractBehavior<BGS, BCS, SF>,
        reindexBehavior: RevReindexBehavior<BGS, BCS, SF>,
        private readonly _eventBehavior: RevEventBehavior<BGS, BCS, SF>,
        customUiControllerDefinitions: RevUiController.Definition<BGS, BCS, SF>[] | undefined,
    ) {
        this._sharedState = {
            locationCursorName: undefined,
            locationTitleText: undefined,
        };

        this._services = new RevUiControllerServices(
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

    load(customUiControllerDefinitions: RevUiController.Definition<BGS, BCS, SF>[] | undefined) {
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
    private handlePointerMoveEvent(event: PointerEvent): RevLinedHoverCell<BCS, SF> | null | undefined {
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
    private handleClickEvent(event: MouseEvent): RevLinedHoverCell<BCS, SF> | null | undefined {
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
    private handleContextMenuEvent(event: MouseEvent): RevLinedHoverCell<BCS, SF> | null | undefined {
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
    private handleWheelMovedEvent(event: WheelEvent): RevLinedHoverCell<BCS, SF> | null | undefined {
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
    private handlePointerUpCancelEvent(event: PointerEvent): RevLinedHoverCell<BCS, SF> | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiController.handlePointerUpCancel(event, null);
            return cell;
        } else {
            return null;
        }
    }

    /** @internal */
    private handlePointerDragStartEvent(event: DragEvent): RevEventBehavior.UiPointerDragStartResult<BCS, SF> {
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
    private handlePointerDragEvent(event: PointerEvent): RevLinedHoverCell<BCS, SF> | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiController.handlePointerDrag(event, null);
            return cell;
        } else {
            return null;
        }
    }

    /** @internal */
    private handlePointerDragEndEvent(event: PointerEvent): RevLinedHoverCell<BCS, SF> | null | undefined {
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
    private handleDblClickEvent(event: MouseEvent): RevLinedHoverCell<BCS, SF> | null | undefined {
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
    private handlePointerDownEvent(event: PointerEvent): RevLinedHoverCell<BCS, SF> | null | undefined {
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
    private handlePointerEnterEvent(event: PointerEvent): RevLinedHoverCell<BCS, SF> | null | undefined {
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
    private handlePointerLeaveOutEvent(event: PointerEvent): RevLinedHoverCell<BCS, SF> | null | undefined {
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
    private handleHorizontalScrollerActionEvent(eventDetail: RevScroller.Action) {
        if (this._enabled) {
            this._firstUiController.handleHorizontalScrollerAction(eventDetail);
        }
    }

    /** @internal */
    private handleVerticalScrollerActionEvent(eventDetail: RevScroller.Action) {
        if (this._enabled) {
            this._firstUiController.handleVerticalScrollerAction(eventDetail);
        }
    }

    /** @internal */
    private createAndLinkUiControllers(customUiControllerDefinitions: RevUiController.Definition<BGS, BCS, SF>[] | undefined) {
        /**
         * Controller chain of command.
         * @remarks Each feature is linked to the next feature.
         */

        /**
         * Hash of instantiated features by class names.
         * @remarks Built here but otherwise not in use.
         */

        this._uiControllerFactory.registerDefinition(RevFocusScrollUiController.typeName, RevFocusScrollUiController);
        this._uiControllerFactory.registerDefinition(RevCellClickUiController.typeName, RevCellClickUiController);
        this._uiControllerFactory.registerDefinition(RevSelectionUiController.typeName, RevSelectionUiController);
        this._uiControllerFactory.registerDefinition(RevColumnMovingUiController.typeName, RevColumnMovingUiController);
        this._uiControllerFactory.registerDefinition(RevColumnResizingUiController.typeName, RevColumnResizingUiController);
        this._uiControllerFactory.registerDefinition(RevColumnSortingUiController.typeName, RevColumnSortingUiController);
        this._uiControllerFactory.registerDefinition(RevFiltersUiController.typeName, RevFiltersUiController);
        this._uiControllerFactory.registerDefinition(RevHoverUiController.typeName, RevHoverUiController);
        this._uiControllerFactory.registerDefinition(RevRowResizingUiController.typeName, RevRowResizingUiController);
        this._uiControllerFactory.registerDefinition(RevTouchScrollingUiController.typeName, RevTouchScrollingUiController);
        this._uiControllerFactory.registerDefinition(RevClipboardUiController.typeName, RevClipboardUiController);
        if (customUiControllerDefinitions !== undefined) {
            for (const { typeName, constructor } of customUiControllerDefinitions) {
                this._uiControllerFactory.registerDefinition(typeName, constructor);
            }
        }

        const typeNames = this._gridSettings.defaultUiControllerTypeNames;
        const maxCount = typeNames.length;
        const uiControllers = new Array<RevUiController<BGS, BCS, SF>>(maxCount);
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

            RevUiControllerSharedState.initialise(this._sharedState);
            firstUiController.initialise();

            return firstUiController;
        }
    }
}
