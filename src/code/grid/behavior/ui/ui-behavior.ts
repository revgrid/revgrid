
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
import { MainSubgrid } from '../../interfaces/data/main-subgrid';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { MergableColumnSettings } from '../../interfaces/settings/mergable-column-settings';
import { MergableGridSettings } from '../../interfaces/settings/mergable-grid-settings';
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
 * @internal
 */
export abstract class UiBehavior<MGS extends MergableGridSettings, MCS extends MergableColumnSettings> {
    abstract readonly typeName: string;

    protected readonly sharedState: UiBehaviorSharedState;
    protected readonly containerHtmlElement: HTMLElement;

    protected readonly gridSettings: GridSettings;
    protected readonly canvasManager: CanvasManager<MGS>;
    protected readonly selection: Selection<MGS, MCS>;
    protected readonly focus: Focus<MGS, MCS>;
    protected readonly columnsManager: ColumnsManager<MGS, MCS>;
    protected readonly subgridsManager: SubgridsManager<MGS, MCS>;
    protected readonly viewLayout: ViewLayout<MGS, MCS>;
    protected readonly renderer: Renderer<MGS, MCS>;
    protected readonly reindexBehavior: ReindexBehavior<MGS, MCS>;

    protected readonly mouse: Mouse<MGS, MCS>;

    protected readonly focusScrollBehavior: FocusScrollBehavior<MGS, MCS>;
    protected readonly focusSelectBehavior: FocusSelectBehavior<MGS, MCS>;
    protected readonly rowPropertiesBehavior: RowPropertiesBehavior<MGS, MCS>;
    protected readonly cellPropertiesBehavior: CellPropertiesBehavior<MGS, MCS>;
    protected readonly dataExtractBehavior: DataExtractBehavior<MGS, MCS>;
    protected readonly eventBehavior: EventBehavior<MGS, MCS>;

    protected readonly mainSubgrid: MainSubgrid<MCS>;

    constructor(services: UiBehaviorServices<MGS, MCS>) {
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
    next: UiBehavior<MGS, MCS> | undefined;

    /**
     * a temporary holding field for my next feature when I'm in a disconnected state
     */
    detached: UiBehavior<MGS, MCS> | undefined;

    /**
     * @desc set my next field, or if it's populated delegate to the feature in my next field
     * @param nextFeature - this is how we build the chain of responsibility
     */
    setNext(nextFeature: UiBehavior<MGS, MCS>) {
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

    handleKeyDown(eventDetail: EventDetail.Keyboard) {
        if (this.next) {
            this.next.handleKeyDown(eventDetail);
        // } else {
        //     return true;
        }
    }

    handleKeyUp(eventDetail: EventDetail.Keyboard) {
        if (this.next) {
            this.next.handleKeyUp(eventDetail);
        }
    }

    handlePointerMove(event: PointerEvent, cell: HoverCell<MCS> | null | undefined): HoverCell<MCS> | null | undefined {
        if (this.next) {
            return this.next.handlePointerMove(event, cell);
        } else {
            return cell;
        }
    }

    handlePointerLeaveOut(event: PointerEvent, cell: HoverCell<MCS> | null | undefined): HoverCell<MCS> | null | undefined {
        if (this.next) {
            return this.next.handlePointerLeaveOut(event, cell);
        } else {
            return cell;
        }
    }

    handlePointerEnter(event: PointerEvent, cell: HoverCell<MCS> | null | undefined): HoverCell<MCS> | null | undefined {
        if (this.next) {
            return this.next.handlePointerEnter(event, cell);
        } else {
            return cell;
        }
    }

    handlePointerDown(event: PointerEvent, cell: HoverCell<MCS> | null | undefined): HoverCell<MCS> | null | undefined {
        if (this.next) {
            return this.next.handlePointerDown(event, cell);
        } else {
            return cell;
        }
    }

    handlePointerUpCancel(event: PointerEvent, cell: HoverCell<MCS> | null | undefined): HoverCell<MCS> | null | undefined {
        if (this.next) {
            return this.next.handlePointerUpCancel(event, cell);
        } else {
            return cell;
        }
    }

    handleWheelMove(event: WheelEvent, cell: HoverCell<MCS> | null | undefined): HoverCell<MCS> | null | undefined {
        if (this.next) {
            return this.next.handleWheelMove(event, cell);
        } else {
            return cell;
        }
    }

    handleDblClick(event: MouseEvent, cell: HoverCell<MCS> | null | undefined): HoverCell<MCS> | null | undefined {
        if (this.next) {
            return this.next.handleDblClick(event, cell);
        } else {
            return cell;
        }
    }

    handleClick(event: MouseEvent, cell: HoverCell<MCS> | null | undefined): HoverCell<MCS> | null | undefined {
        if (this.next) {
            return this.next.handleClick(event, cell);
        } else {
            return cell;
        }
    }

    handlePointerDragStart(event: DragEvent, cell: HoverCell<MCS> | null | undefined): EventBehavior.UiPointerDragStartResult<MCS> {
        if (this.next) {
            return this.next.handlePointerDragStart(event, cell);
        } else {
            return {
                started: false,
                cell,
            };
        }
    }

    handlePointerDrag(event: PointerEvent, cell: HoverCell<MCS> | null | undefined): HoverCell<MCS> | null | undefined {
        if (this.next) {
            return this.next.handlePointerDrag(event, cell);
        } else {
            return cell;
        }
    }

    handlePointerDragEnd(event: PointerEvent, cell: HoverCell<MCS> | null | undefined): HoverCell<MCS> | null | undefined {
        if (this.next) {
            return this.next.handlePointerDragEnd(event, cell);
        } else {
            return cell;
        }
    }

    handleContextMenu(event: MouseEvent, cell: HoverCell<MCS> | null | undefined): HoverCell<MCS> | null | undefined {
        if (this.next) {
            return this.next.handleContextMenu(event, cell);
        } else {
            return cell;
        }
    }

    handleTouchStart(eventDetail: TouchEvent) {
        if (this.next) {
            this.next.handleTouchStart(eventDetail);
        }
    }

    handleTouchMove(eventDetail: TouchEvent) {
        if (this.next) {
            this.next.handleTouchMove(eventDetail);
        }
    }

    handleTouchEnd(eventDetail: TouchEvent) {
        if (this.next) {
            this.next.handleTouchEnd(eventDetail);
        }
    }

    handleCopy(eventDetail: ClipboardEvent) {
        if (this.next) {
            this.next.handleCopy(eventDetail);
        }
    }

    handleHorizontalScrollerAction(action: EventDetail.ScrollerAction) {
        if (this.next) {
            this.next.handleHorizontalScrollerAction(action);
        }
    }

    handleVerticalScrollerAction(action: EventDetail.ScrollerAction) {
        if (this.next) {
            this.next.handleVerticalScrollerAction(action);
        }
    }

    initializeOn() {
        if (this.next) {
            this.next.initializeOn();
        }
    }

    protected tryGetHoverCellFromMouseEvent(event: MouseEvent): HoverCell<MCS> | null {
        const cell = this.viewLayout.findHoverCell(event.offsetX, event.offsetY);
        if (cell === undefined) {
            return null;
        } else {
            return cell;
        }
    }
}

/** @internal */
export namespace UiBehavior {
    export type Constructor<MGS extends MergableGridSettings, MCS extends MergableColumnSettings> = new (services: UiBehaviorServices<MGS, MCS>) => UiBehavior<MGS, MCS>;

    export interface UiBehaviorDefinition<MGS extends MergableGridSettings, MCS extends MergableColumnSettings> {
        typeName: string;
        constructor: Constructor<MGS, MCS>;
    }
}
