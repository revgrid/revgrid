
import { CellPropertiesBehavior } from '../../behavior/cell-properties-behavior';
import { DataExtractBehavior } from '../../behavior/data-extract-behavior';
import { EventBehavior } from '../../behavior/event-behavior';
import { FocusScrollBehavior } from '../../behavior/focus-scroll-behavior';
import { FocusSelectBehavior } from '../../behavior/focus-select-behavior';
import { ReindexBehavior } from '../../behavior/reindex-behavior';
import { RowPropertiesBehavior } from '../../behavior/row-properties-behavior';
import { Canvas } from '../../components/canvas/canvas';
import { ColumnsManager } from '../../components/column/columns-manager';
import { Focus } from '../../components/focus/focus';
import { Mouse } from '../../components/mouse/mouse';
import { Renderer } from '../../components/renderer/renderer';
import { Scroller } from '../../components/scroller/scroller';
import { Selection } from '../../components/selection/selection';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../components/view/view-layout';
import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { MainSubgrid } from '../../interfaces/data/main-subgrid';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { RevgridObject } from '../../types-utils/revgrid-object';
import { UiControllerServices } from './common/ui-controller-services';
import { UiControllerSharedState } from './common/ui-controller-shared-state';

/**
 * Instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 * @public
 */
export abstract class UiController<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> implements RevgridObject {
    readonly revgridId: string;
    readonly internalParent: RevgridObject;

    abstract readonly typeName: string;

    protected readonly sharedState: UiControllerSharedState;
    protected readonly hostElement: HTMLElement;

    protected readonly gridSettings: GridSettings;
    protected readonly canvas: Canvas<BGS>;
    protected readonly selection: Selection<BGS, BCS, SF>;
    protected readonly focus: Focus<BGS, BCS, SF>;
    protected readonly columnsManager: ColumnsManager<BCS, SF>;
    protected readonly subgridsManager: SubgridsManager<BCS, SF>;
    protected readonly viewLayout: ViewLayout<BGS, BCS, SF>;
    protected readonly renderer: Renderer<BGS, BCS, SF>;
    protected readonly reindexBehavior: ReindexBehavior<BGS, BCS, SF>;

    protected readonly mouse: Mouse<BGS, BCS, SF>;
    protected readonly horizontalScroller: Scroller<BGS, BCS, SF>;
    protected readonly verticalScroller: Scroller<BGS, BCS, SF>;

    protected readonly focusScrollBehavior: FocusScrollBehavior<BGS, BCS, SF>;
    protected readonly focusSelectBehavior: FocusSelectBehavior<BGS, BCS, SF>;
    protected readonly rowPropertiesBehavior: RowPropertiesBehavior<BGS, BCS, SF>;
    protected readonly cellPropertiesBehavior: CellPropertiesBehavior<BGS, BCS, SF>;
    protected readonly dataExtractBehavior: DataExtractBehavior<BGS, BCS, SF>;
    protected readonly eventBehavior: EventBehavior<BGS, BCS, SF>;

    protected readonly mainSubgrid: MainSubgrid<BCS, SF>;

    constructor(services: UiControllerServices<BGS, BCS, SF>) {
        this.revgridId = services.revgridId;
        this.internalParent = services.internalParent;

        this.sharedState = services.sharedState;
        this.hostElement = services.hostElement;

        this.gridSettings = services.gridSettings;
        this.canvas = services.canvas;
        this.selection = services.selection;
        this.focus = services.focus;
        this.columnsManager = services.columnsManager;
        this.subgridsManager = services.subgridsManager;
        this.viewLayout = services.viewLayout;
        this.renderer = services.renderer;
        this.reindexBehavior = services.reindexBehavior;

        this.mouse = services.mouse;
        this.horizontalScroller = services.horizontalScroller;
        this.verticalScroller = services.verticalScroller;

        this.focusScrollBehavior = services.focusScrollBehavior;
        this.focusSelectBehavior = services.focusSelectBehavior;
        this.rowPropertiesBehavior = services.rowPropertiesBehavior;
        this.cellPropertiesBehavior = services.cellPropertiesBehavior;
        this.dataExtractBehavior = services.dataExtractBehavior;
        this.eventBehavior = services.eventBehavior;

        this.mainSubgrid = this.subgridsManager.mainSubgrid;
    }

    /**
     * the next feature to be given a chance to handle incoming events
     */
    next: UiController<BGS, BCS, SF> | undefined;

    /**
     * a temporary holding field for my next feature when I'm in a disconnected state
     */
    detached: UiController<BGS, BCS, SF> | undefined;

    /**
     * set my next field, or if it's populated delegate to the feature in my next field
     * @param nextFeature - this is how we build the chain of responsibility
     */
    setNext(nextFeature: UiController<BGS, BCS, SF>) {
        if (this.next !== undefined) {
            this.next.setNext(nextFeature);
        } else {
            this.next = nextFeature;
            this.detached = nextFeature;
        }
    }

    /**
     * disconnect my child
     */
    detachChain() {
        this.next = undefined;
    }

    /**
     * reattach my child from the detached reference
     */
    attachChain() {
        this.next = this.detached;
    }

    /** @internal */
    handleKeyDown(event: KeyboardEvent, fromEditor: boolean) {
        if (this.next) {
            this.next.handleKeyDown(event, fromEditor);
        // } else {
        //     return true;
        }
    }

    /** @internal */
    handleKeyUp(event: KeyboardEvent) {
        if (this.next) {
            this.next.handleKeyUp(event);
        }
    }

    /** @internal */
    handlePointerMove(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined): LinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handlePointerMove(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerLeaveOut(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined): LinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handlePointerLeaveOut(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerEnter(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined): LinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handlePointerEnter(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerDown(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined): LinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handlePointerDown(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerUpCancel(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined): LinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handlePointerUpCancel(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handleWheelMove(event: WheelEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined): LinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handleWheelMove(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handleDblClick(event: MouseEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined): LinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handleDblClick(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handleClick(event: MouseEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined): LinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handleClick(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerDragStart(event: DragEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined): EventBehavior.UiPointerDragStartResult<BCS, SF> {
        if (this.next) {
            return this.next.handlePointerDragStart(event, hoverCell);
        } else {
            return {
                started: false,
                hoverCell,
            };
        }
    }

    /** @internal */
    handlePointerDrag(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined): LinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handlePointerDrag(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerDragEnd(event: PointerEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined): LinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handlePointerDragEnd(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handleContextMenu(event: MouseEvent, hoverCell: LinedHoverCell<BCS, SF> | null | undefined): LinedHoverCell<BCS, SF> | null | undefined {
        if (this.next) {
            return this.next.handleContextMenu(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handleTouchStart(eventDetail: TouchEvent) {
        if (this.next) {
            this.next.handleTouchStart(eventDetail);
        }
    }

    /** @internal */
    handleTouchMove(eventDetail: TouchEvent) {
        if (this.next) {
            this.next.handleTouchMove(eventDetail);
        }
    }

    /** @internal */
    handleTouchEnd(eventDetail: TouchEvent) {
        if (this.next) {
            this.next.handleTouchEnd(eventDetail);
        }
    }

    /** @internal */
    handleCopy(eventDetail: ClipboardEvent) {
        if (this.next) {
            this.next.handleCopy(eventDetail);
        }
    }

    /** @internal */
    handleHorizontalScrollerAction(action: Scroller.Action) {
        if (this.next) {
            this.next.handleHorizontalScrollerAction(action);
        }
    }

    /** @internal */
    handleVerticalScrollerAction(action: Scroller.Action) {
        if (this.next) {
            this.next.handleVerticalScrollerAction(action);
        }
    }

    /** @internal */
    initialise() {
        if (this.next) {
            this.next.initialise();
        }
    }

    /** @internal */
    protected tryGetHoverCellFromMouseEvent(event: MouseEvent): LinedHoverCell<BCS, SF> | undefined {
        return this.viewLayout.findLinedHoverCellAtCanvasOffset(event.offsetX, event.offsetY);
    }
}

/** @public */
export namespace UiController {
    export type Constructor<
        BGS extends BehavioredGridSettings,
        BCS extends BehavioredColumnSettings,
        SF extends SchemaField
    > = new (services: UiControllerServices<BGS, BCS, SF>) => UiController<BGS, BCS, SF>;

    export interface Definition<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> {
        typeName: string;
        constructor: Constructor<BGS, BCS, SF>;
    }
}
