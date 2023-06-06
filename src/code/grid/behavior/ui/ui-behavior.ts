
import { CanvasManager } from '../../components/canvas/canvas-manager';
import { ColumnsManager } from '../../components/column/columns-manager';
import { EventDetail } from '../../components/event/event-detail';
import { Focus } from '../../components/focus/focus';
import { Mouse } from '../../components/mouse/mouse';
import { Renderer } from '../../components/renderer/renderer';
import { Selection } from '../../components/selection/selection';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../components/view/view-layout';
import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { MainSubgrid } from '../../interfaces/data/main-subgrid';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { CellPropertiesBehavior } from '../component/cell-properties-behavior';
import { DataExtractBehavior } from '../component/data-extract-behavior';
import { EventBehavior } from '../component/event-behavior';
import { FocusScrollBehavior } from '../component/focus-scroll-behavior';
import { FocusSelectBehavior } from '../component/focus-select-behavior';
import { ReindexBehavior } from '../component/reindex-behavior';
import { RowPropertiesBehavior } from '../component/row-properties-behavior';
import { UiBehaviorServices } from './ui-behavior-services';
import { UiBehaviorSharedState } from './ui-behavior-shared-state';

/**
 * Instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 * @public
 */
export abstract class UiBehavior<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings> {
    abstract readonly typeName: string;

    protected readonly sharedState: UiBehaviorSharedState;
    protected readonly containerHtmlElement: HTMLElement;

    protected readonly gridSettings: GridSettings;
    protected readonly canvasManager: CanvasManager<BGS>;
    protected readonly selection: Selection<BGS, BCS>;
    protected readonly focus: Focus<BGS, BCS>;
    protected readonly columnsManager: ColumnsManager<BGS, BCS>;
    protected readonly subgridsManager: SubgridsManager<BGS, BCS>;
    protected readonly viewLayout: ViewLayout<BGS, BCS>;
    protected readonly renderer: Renderer<BGS, BCS>;
    protected readonly reindexBehavior: ReindexBehavior<BGS, BCS>;

    protected readonly mouse: Mouse<BGS, BCS>;

    protected readonly focusScrollBehavior: FocusScrollBehavior<BGS, BCS>;
    protected readonly focusSelectBehavior: FocusSelectBehavior<BGS, BCS>;
    protected readonly rowPropertiesBehavior: RowPropertiesBehavior<BGS, BCS>;
    protected readonly cellPropertiesBehavior: CellPropertiesBehavior<BGS, BCS>;
    protected readonly dataExtractBehavior: DataExtractBehavior<BGS, BCS>;
    protected readonly eventBehavior: EventBehavior<BGS, BCS>;

    protected readonly mainSubgrid: MainSubgrid<BCS>;

    constructor(services: UiBehaviorServices<BGS, BCS>) {
        this.sharedState = services.sharedState;
        this.containerHtmlElement = services.containerHtmlElement;

        this.gridSettings = services.gridSettings;
        this.canvasManager = services.canvasManager;
        this.selection = services.selection;
        this.focus = services.focus;
        this.columnsManager = services.columnsManager;
        this.subgridsManager = services.subgridsManager;
        this.viewLayout = services.viewLayout;
        this.renderer = services.renderer;
        this.reindexBehavior = services.reindexBehavior;

        this.mouse = services.mouse;

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
    next: UiBehavior<BGS, BCS> | undefined;

    /**
     * a temporary holding field for my next feature when I'm in a disconnected state
     */
    detached: UiBehavior<BGS, BCS> | undefined;

    /**
     * @desc set my next field, or if it's populated delegate to the feature in my next field
     * @param nextFeature - this is how we build the chain of responsibility
     */
    setNext(nextFeature: UiBehavior<BGS, BCS>) {
        if (this.next !== undefined) {
            this.next.setNext(nextFeature);
        } else {
            this.next = nextFeature;
            this.detached = nextFeature;
        }
    }

    /**
     * @desc disconnect my child
     */
    detachChain() {
        this.next = undefined;
    }

    /**
     * @desc reattach my child from the detached reference
     */
    attachChain() {
        this.next = this.detached;
    }

    /** @internal */
    handleKeyDown(eventDetail: EventDetail.Keyboard) {
        if (this.next) {
            this.next.handleKeyDown(eventDetail);
        // } else {
        //     return true;
        }
    }

    /** @internal */
    handleKeyUp(eventDetail: EventDetail.Keyboard) {
        if (this.next) {
            this.next.handleKeyUp(eventDetail);
        }
    }

    /** @internal */
    handlePointerMove(event: PointerEvent, hoverCell: LinedHoverCell<BCS> | null | undefined): LinedHoverCell<BCS> | null | undefined {
        if (this.next) {
            return this.next.handlePointerMove(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerLeaveOut(event: PointerEvent, hoverCell: LinedHoverCell<BCS> | null | undefined): LinedHoverCell<BCS> | null | undefined {
        if (this.next) {
            return this.next.handlePointerLeaveOut(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerEnter(event: PointerEvent, hoverCell: LinedHoverCell<BCS> | null | undefined): LinedHoverCell<BCS> | null | undefined {
        if (this.next) {
            return this.next.handlePointerEnter(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerDown(event: PointerEvent, hoverCell: LinedHoverCell<BCS> | null | undefined): LinedHoverCell<BCS> | null | undefined {
        if (this.next) {
            return this.next.handlePointerDown(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerUpCancel(event: PointerEvent, hoverCell: LinedHoverCell<BCS> | null | undefined): LinedHoverCell<BCS> | null | undefined {
        if (this.next) {
            return this.next.handlePointerUpCancel(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handleWheelMove(event: WheelEvent, hoverCell: LinedHoverCell<BCS> | null | undefined): LinedHoverCell<BCS> | null | undefined {
        if (this.next) {
            return this.next.handleWheelMove(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handleDblClick(event: MouseEvent, hoverCell: LinedHoverCell<BCS> | null | undefined): LinedHoverCell<BCS> | null | undefined {
        if (this.next) {
            return this.next.handleDblClick(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handleClick(event: MouseEvent, hoverCell: LinedHoverCell<BCS> | null | undefined): LinedHoverCell<BCS> | null | undefined {
        if (this.next) {
            return this.next.handleClick(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerDragStart(event: DragEvent, hoverCell: LinedHoverCell<BCS> | null | undefined): EventBehavior.UiPointerDragStartResult<BCS> {
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
    handlePointerDrag(event: PointerEvent, hoverCell: LinedHoverCell<BCS> | null | undefined): LinedHoverCell<BCS> | null | undefined {
        if (this.next) {
            return this.next.handlePointerDrag(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handlePointerDragEnd(event: PointerEvent, hoverCell: LinedHoverCell<BCS> | null | undefined): LinedHoverCell<BCS> | null | undefined {
        if (this.next) {
            return this.next.handlePointerDragEnd(event, hoverCell);
        } else {
            return hoverCell;
        }
    }

    /** @internal */
    handleContextMenu(event: MouseEvent, hoverCell: LinedHoverCell<BCS> | null | undefined): LinedHoverCell<BCS> | null | undefined {
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
    handleHorizontalScrollerAction(action: EventDetail.ScrollerAction) {
        if (this.next) {
            this.next.handleHorizontalScrollerAction(action);
        }
    }

    /** @internal */
    handleVerticalScrollerAction(action: EventDetail.ScrollerAction) {
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
    protected tryGetHoverCellFromMouseEvent(event: MouseEvent): LinedHoverCell<BCS> | null {
        const cell = this.viewLayout.findLinedHoverCell(event.offsetX, event.offsetY);
        if (cell === undefined) {
            return null;
        } else {
            return cell;
        }
    }
}

/** @public */
export namespace UiBehavior {
    export type Constructor<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings> = new (services: UiBehaviorServices<BGS, BCS>) => UiBehavior<BGS, BCS>;

    export interface UiBehaviorDefinition<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings> {
        typeName: string;
        constructor: Constructor<BGS, BCS>;
    }
}
