import { CanvasManager } from '../../components/canvas/canvas-manager';
import { ColumnsManager } from '../../components/column/columns-manager';
import { EventDetail } from '../../components/event/event-detail';
import { Focus } from '../../components/focus/focus';
import { Mouse } from '../../components/mouse/mouse';
import { Renderer } from '../../components/renderer/renderer';
import { Selection } from '../../components/selection/selection';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../components/view/view-layout';
import { HoverCell } from '../../interfaces/data/hover-cell';
import { MergableColumnSettings } from '../../interfaces/settings/mergable-column-settings';
import { MergableGridSettings } from '../../interfaces/settings/mergable-grid-settings';
import { AssertError } from '../../types-utils/revgrid-error';
import { CellPropertiesBehavior } from '../component/cell-properties-behavior';
import { DataExtractBehavior } from '../component/data-extract-behavior';
import { EventBehavior } from '../component/event-behavior';
import { FocusScrollBehavior } from '../component/focus-scroll-behavior';
import { FocusSelectBehavior } from '../component/focus-select-behavior';
import { ReindexBehavior } from '../component/reindex-behavior';
import { RowPropertiesBehavior } from '../component/row-properties-behavior';
import { CellClickUiBehavior } from './cell-click-ui-behavior';
import { ClipboardUiBehavior } from './clipboard-ui-action';
import { ColumnMovingUiBehavior } from './column-moving-ui-behavior';
import { ColumnResizingUiBehavior } from './column-resizing-ui-behavior';
import { ColumnSortingUiBehavior } from './column-sorting-ui-behavior';
import { FiltersUiBehavior } from './filters-ui-behavior';
import { FocusScrollUiBehavior } from './focus-scroll-ui-behavior';
import { HoverUiBehavior } from './hover-ui-behavior';
import { RowResizingUiBehavior } from './row-resizing-ui-behavior';
import { SelectionUiBehavior } from './selection-ui-behavior';
import { TouchScrollingUiBehavior } from './touch-scrolling-ui-behavior';
import { UiBehavior } from './ui-behavior';
import { UiBehaviorFactory } from './ui-behavior-factory';
import { UiBehaviorServices } from './ui-behavior-services';
import { UiBehaviorSharedState } from './ui-behavior-shared-state';

/** @internal */
export class UiBehaviorManager<MGS extends MergableGridSettings, MCS extends MergableColumnSettings> {
    private readonly _uiBehaviorFactory = new UiBehaviorFactory<MGS, MCS>();
    private readonly _uiBehaviorMap = new Map<string, UiBehavior<MGS, MCS>>();
    private readonly _firstUiBehavior: UiBehavior<MGS, MCS>;

    readonly _sharedState: UiBehaviorSharedState; // Will be initialised in constructor
    readonly _services: UiBehaviorServices<MGS, MCS>;

    private _enabled = false;

    constructor(
        containerHtmlElement: HTMLElement,
        private readonly _gridSettings: MGS,
        canvasManager: CanvasManager<MGS>,
        focus: Focus<MGS, MCS>,
        selection: Selection<MGS, MCS>,
        columnsManager: ColumnsManager<MGS, MCS>,
        subgridsManager: SubgridsManager<MGS, MCS>,
        viewLayout: ViewLayout<MGS, MCS>,
        renderer: Renderer<MGS, MCS>,
        private readonly _mouse: Mouse<MGS, MCS>,
        focusScrollBehavior: FocusScrollBehavior<MGS, MCS>,
        selectionBehavior: FocusSelectBehavior<MGS, MCS>,
        rowPropertiesBehavior: RowPropertiesBehavior<MGS, MCS>,
        cellPropertiesBehavior: CellPropertiesBehavior<MGS, MCS>,
        dataExtractBehavior: DataExtractBehavior<MGS, MCS>,
        reindexBehavior: ReindexBehavior<MGS, MCS>,
        private readonly _eventBehavior: EventBehavior<MGS, MCS>,
        customUiBehaviorDefinitions: UiBehavior.UiBehaviorDefinition<MGS, MCS>[] | undefined,
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

        this._firstUiBehavior = this.load(customUiBehaviorDefinitions);

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
        this._eventBehavior.uiHorizontalScrollerActionEventer = (event) => this.handleHorizontalScrollerActionEvent(event);
        this._eventBehavior.uiVerticalScrollerActionEventer = (event) => this.handleVerticalScrollerActionEvent(event);
    }

    load(customUiBehaviorDefinitions: UiBehavior.UiBehaviorDefinition<MGS, MCS>[] | undefined) {
        /**
         * @summary Controller chain of command.
         * @desc Each feature is linked to the next feature.
         */

        /**
         * @summary Hash of instantiated features by class names.
         * @desc Built here but otherwise not in use.
         */

        // UiBehaviorFactory.register(CellEditingFeature.typeName, CellEditingFeature);
        this._uiBehaviorFactory.registerDefinition(FocusScrollUiBehavior.typeName, FocusScrollUiBehavior);
        this._uiBehaviorFactory.registerDefinition(CellClickUiBehavior.typeName, CellClickUiBehavior);
        this._uiBehaviorFactory.registerDefinition(SelectionUiBehavior.typeName, SelectionUiBehavior);
        this._uiBehaviorFactory.registerDefinition(ColumnMovingUiBehavior.typeName, ColumnMovingUiBehavior);
        this._uiBehaviorFactory.registerDefinition(ColumnResizingUiBehavior.typeName, ColumnResizingUiBehavior);
        this._uiBehaviorFactory.registerDefinition(ColumnSortingUiBehavior.typeName, ColumnSortingUiBehavior);
        this._uiBehaviorFactory.registerDefinition(FiltersUiBehavior.typeName, FiltersUiBehavior);
        this._uiBehaviorFactory.registerDefinition(HoverUiBehavior.typeName, HoverUiBehavior);
        this._uiBehaviorFactory.registerDefinition(RowResizingUiBehavior.typeName, RowResizingUiBehavior);
        this._uiBehaviorFactory.registerDefinition(TouchScrollingUiBehavior.typeName, TouchScrollingUiBehavior);
        this._uiBehaviorFactory.registerDefinition(ClipboardUiBehavior.typeName, ClipboardUiBehavior);
        if (customUiBehaviorDefinitions !== undefined) {
            for (const { typeName, constructor } of customUiBehaviorDefinitions) {
                this._uiBehaviorFactory.registerDefinition(typeName, constructor);
            }
        }

        const typeNames = this._gridSettings.defaultUiBehaviorTypeNames;
        const maxCount = typeNames.length;
        const uiBehaviors = new Array<UiBehavior<MGS, MCS>>(maxCount);
        let count = 0;
        for (let i = 0; i < maxCount; i++) {
            const name = typeNames[i];
            const uiBehavior = this._uiBehaviorFactory.create(name, this._services);
            if (uiBehavior === undefined) {
                throw new AssertError('UBMLR23098', `UiBehavior not registered: ${name}`);
            } else {
                uiBehaviors[count++] = uiBehavior;
            }
        }

        if (count === 0) {
            throw new AssertError('UBMLZ23098', 'Zero UiBehaviors specified in Grid Settings (require at least one)');
        } else {
            const firstUiBehavior = uiBehaviors[0];
            let previousUiBehavior = firstUiBehavior;
            for (let i = 1; i < count; i++) {
                const uiBehavior = uiBehaviors[i];
                previousUiBehavior.setNext(uiBehavior);
                previousUiBehavior = uiBehavior;
            }

            this._firstUiBehavior.initializeOn();
            UiBehaviorSharedState.initialise(this._sharedState);

            return this._firstUiBehavior;
        }
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
    private handlePointerMoveEvent(event: PointerEvent): HoverCell<MCS> | null | undefined {
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
    private handleClickEvent(event: MouseEvent): HoverCell<MCS> | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleClick(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling tap to the feature chain of responsibility
     * @internal
     */
    private handleContextMenuEvent(event: MouseEvent): HoverCell<MCS> | null | undefined {
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
    private handleWheelMovedEvent(event: WheelEvent): HoverCell<MCS> | null | undefined {
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
    private handlePointerUpCancelEvent(event: PointerEvent): HoverCell<MCS> | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handlePointerUpCancel(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    private handlePointerDragStartEvent(event: DragEvent): EventBehavior.UiPointerDragStartResult<MCS> {
        if (this._enabled) {
            return this._firstUiBehavior.handlePointerDragStart(event, undefined);
        } else {
            return {
                started: false,
                cell: undefined,
            };
        }
    }

    private handlePointerDragEvent(event: PointerEvent): HoverCell<MCS> | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handlePointerDrag(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    private handlePointerDragEndEvent(event: PointerEvent): HoverCell<MCS> | null | undefined {
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
    private handleDblClickEvent(event: MouseEvent): HoverCell<MCS> | null | undefined {
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
    private handlePointerDownEvent(event: PointerEvent): HoverCell<MCS> | null | undefined {
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
    private handlePointerEnterEvent(event: PointerEvent): HoverCell<MCS> | null | undefined {
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
    private handlePointerLeaveOutEvent(event: PointerEvent): HoverCell<MCS> | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handlePointerLeaveOut(event, undefined);
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
