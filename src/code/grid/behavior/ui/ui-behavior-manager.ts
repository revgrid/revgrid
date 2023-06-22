import { CanvasManager } from '../../components/canvas/canvas-manager';
import { ColumnsManager } from '../../components/column/columns-manager';
import { Focus } from '../../components/focus/focus';
import { Mouse } from '../../components/mouse/mouse';
import { Renderer } from '../../components/renderer/renderer';
import { Scroller } from '../../components/scroller/scroller';
import { Selection } from '../../components/selection/selection';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../components/view/view-layout';
import { EventDetail } from '../../interfaces/data/event-detail';
import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
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
export class UiBehaviorManager<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField<BCS>> {
    private readonly _uiBehaviorFactory = new UiBehaviorFactory<BGS, BCS, SF>();
    private readonly _uiBehaviorMap = new Map<string, UiBehavior<BGS, BCS, SF>>();
    private readonly _sharedState: UiBehaviorSharedState; // Will be initialised in constructor
    private readonly _services: UiBehaviorServices<BGS, BCS, SF>;

    private _firstUiBehavior: UiBehavior<BGS, BCS, SF>;
    private _enabled = false;

    constructor(
        containerHtmlElement: HTMLElement,
        private readonly _gridSettings: BGS,
        canvasManager: CanvasManager<BGS>,
        focus: Focus<BGS, BCS, SF>,
        selection: Selection<BCS, SF>,
        columnsManager: ColumnsManager<BCS, SF>,
        subgridsManager: SubgridsManager<BCS, SF>,
        viewLayout: ViewLayout<BGS, BCS, SF>,
        renderer: Renderer<BGS, BCS, SF>,
        private readonly _mouse: Mouse<BGS, BCS, SF>,
        horizontalScroller: Scroller<BGS>,
        verticalScroller: Scroller<BGS>,
        focusScrollBehavior: FocusScrollBehavior<BGS, BCS, SF>,
        selectionBehavior: FocusSelectBehavior<BGS, BCS, SF>,
        rowPropertiesBehavior: RowPropertiesBehavior<BGS, BCS, SF>,
        cellPropertiesBehavior: CellPropertiesBehavior<BGS, BCS, SF>,
        dataExtractBehavior: DataExtractBehavior<BCS, SF>,
        reindexBehavior: ReindexBehavior<BGS, BCS, SF>,
        private readonly _eventBehavior: EventBehavior<BGS, BCS, SF>,
        customUiBehaviorDefinitions: UiBehavior.UiBehaviorDefinition<BGS, BCS, SF>[] | undefined,
    ) {
        this._sharedState = {
            locationCursorName: undefined,
            locationTitleText: undefined,
        };

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

        this._firstUiBehavior = this.createAndLinkUiBehaviors(customUiBehaviorDefinitions);

        this._eventBehavior.uiKeyDownEventer = (event, fromEditor) => this.handleKeyDownEvent(event, fromEditor);
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

    load(customUiBehaviorDefinitions: UiBehavior.UiBehaviorDefinition<BGS, BCS, SF>[] | undefined) {
        this._firstUiBehavior = this.createAndLinkUiBehaviors(customUiBehaviorDefinitions);
        return this._firstUiBehavior;
    }

    enable() {
        this._enabled = true;
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
    private handleKeyDownEvent(eventDetail: KeyboardEvent, fromEditor: boolean) {
        if (this._enabled) {
            this._firstUiBehavior.handleKeyDown(eventDetail, fromEditor);
        }
    }

    /**
     * @desc delegate handling key up to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handleKeyUpEvent(event: KeyboardEvent) {
        if (this._enabled) {
            this._firstUiBehavior.handleKeyUp(event);
        }
    }

    /**
     * @desc delegate handling mouse move to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handlePointerMoveEvent(event: PointerEvent): LinedHoverCell<BCS, SF> | null | undefined {
        if (this._enabled) {
            this._sharedState.locationCursorName = undefined;
            this._sharedState.locationTitleText = undefined;
            const cell = this._firstUiBehavior.handlePointerMove(event, undefined);
            this._mouse.setLocation(this._sharedState.locationCursorName, this._sharedState.locationTitleText);
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
    private handleClickEvent(event: MouseEvent): LinedHoverCell<BCS, SF> | null | undefined {
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
    private handleContextMenuEvent(event: MouseEvent): LinedHoverCell<BCS, SF> | null | undefined {
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
    private handleWheelMovedEvent(event: WheelEvent): LinedHoverCell<BCS, SF> | null | undefined {
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
    private handlePointerUpCancelEvent(event: PointerEvent): LinedHoverCell<BCS, SF> | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handlePointerUpCancel(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    private handlePointerDragStartEvent(event: DragEvent): EventBehavior.UiPointerDragStartResult<BCS, SF> {
        if (this._enabled) {
            return this._firstUiBehavior.handlePointerDragStart(event, undefined);
        } else {
            return {
                started: false,
                hoverCell: undefined,
            };
        }
    }

    private handlePointerDragEvent(event: PointerEvent): LinedHoverCell<BCS, SF> | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handlePointerDrag(event, undefined);
            return cell;
        } else {
            return undefined;
        }
    }

    private handlePointerDragEndEvent(event: PointerEvent): LinedHoverCell<BCS, SF> | null | undefined {
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
    private handleDblClickEvent(event: MouseEvent): LinedHoverCell<BCS, SF> | null | undefined {
        if (this._enabled) {
            this._sharedState.locationCursorName = undefined;
            this._sharedState.locationTitleText = undefined;
            const cell = this._firstUiBehavior.handleDblClick(event, undefined);
            this._mouse.setLocation(this._sharedState.locationCursorName, this._sharedState.locationTitleText);
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
    private handlePointerDownEvent(event: PointerEvent): LinedHoverCell<BCS, SF> | null | undefined {
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
    private handlePointerEnterEvent(event: PointerEvent): LinedHoverCell<BCS, SF> | null | undefined {
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
    private handlePointerLeaveOutEvent(event: PointerEvent): LinedHoverCell<BCS, SF> | null | undefined {
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

    private createAndLinkUiBehaviors(customUiBehaviorDefinitions: UiBehavior.UiBehaviorDefinition<BGS, BCS, SF>[] | undefined) {
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
        const uiBehaviors = new Array<UiBehavior<BGS, BCS, SF>>(maxCount);
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

            UiBehaviorSharedState.initialise(this._sharedState);
            firstUiBehavior.initialise();

            return firstUiBehavior;
        }
    }
}
