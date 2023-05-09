
import { CanvasEx } from '../../components/canvas-ex/canvas-ex';
import { ViewCell } from '../../components/cell/view-cell';
import { ColumnsManager } from '../../components/column/columns-manager';
import { EventDetail } from '../../components/event/event-detail';
import { Focus } from '../../components/focus/focus';
import { ReindexStashManager } from '../../components/model-callback-router/reindex-stash-manager';
import { Mouse } from '../../components/mouse/mouse';
import { Renderer } from '../../components/renderer/renderer';
import { Selection } from '../../components/selection/selection';
import { Subgrid } from '../../components/subgrid/subgrid';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../components/view/view-layout';
import { GridSettings } from '../../interfaces/grid-settings';
import { Point } from '../../lib/point';
import { ScrollAction } from '../../lib/scroll-action';
import { CellPropertiesBehavior } from '../component/cell-properties-behavior';
import { DataExtractBehavior } from '../component/data-extract-behavior';
import { EventBehavior } from '../component/event-behavior';
import { FocusBehavior } from '../component/focus-behavior';
import { RowPropertiesBehavior } from '../component/row-properties-behavior';
import { ScrollBehavior } from '../component/scroll-behaviour';
import { SelectionBehavior } from '../component/selection-behavior';
import { UiBehaviorServices } from './ui-behavior-services';
import { UiBehaviorSharedState } from './ui-behavior-shared-state';

/**
 * Instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 */
export abstract class UiBehavior {

    abstract readonly typeName: string;

    protected readonly scrollBehavior: ScrollBehavior;
    protected readonly focusBehavior: FocusBehavior;
    protected readonly selectionBehavior: SelectionBehavior;
    protected readonly rowPropertiesBehavior: RowPropertiesBehavior;
    protected readonly cellPropertiesBehavior: CellPropertiesBehavior;
    protected readonly dataExtractBehavior: DataExtractBehavior;
    protected readonly eventBehavior: EventBehavior;

    protected readonly sharedState: UiBehaviorSharedState;
    protected readonly containerHtmlElement: HTMLElement;

    protected readonly gridSettings: GridSettings;
    protected readonly mouse: Mouse;
    protected readonly canvasEx: CanvasEx;
    protected readonly selection: Selection;
    protected readonly focus: Focus;
    protected readonly columnsManager: ColumnsManager;
    protected readonly subgridsManager: SubgridsManager;
    protected readonly viewLayout: ViewLayout;
    protected readonly renderer: Renderer;
    protected readonly reindexStashManager: ReindexStashManager;

    protected readonly mainSubgrid: Subgrid;

    constructor(services: UiBehaviorServices) {
        this.focusBehavior = services.focusBehavior;
        this.selectionBehavior = services.selectionBehavior;
        this.scrollBehavior = services.scrollBehavior;
        this.rowPropertiesBehavior = services.rowPropertiesBehavior;
        this.cellPropertiesBehavior = services.cellPropertiesBehavior;
        this.dataExtractBehavior = services.dataExtractBehavior;
        this.eventBehavior = services.eventBehavior;

        this.sharedState = services.sharedState;
        this.containerHtmlElement = services.containerHtmlElement;

        this.gridSettings = services.gridSettings;
        this.mouse = services.mouse;
        this.canvasEx = services.canvasEx;
        this.selection = services.selection;
        this.focus = services.focus;
        this.columnsManager = services.columnsManager;
        this.subgridsManager = services.subgridsManager;
        this.viewLayout = services.viewLayout;
        this.renderer = services.renderer;
        this.reindexStashManager = services.reindexStashManager;
    }

    /**
     * the next feature to be given a chance to handle incoming events
     */
    next: UiBehavior | undefined;

    /**
     * a temporary holding field for my next feature when I'm in a disconnected state
     */
    detached: UiBehavior | undefined;

    /**
     * the cursor I want to be displayed
     */
    cursor: string | undefined;

    /**
     * the cell location where the cursor is currently
     */
    currentHoverCell: Point | undefined;

    /**
     * @desc set my next field, or if it's populated delegate to the feature in my next field
     * @param nextFeature - this is how we build the chain of responsibility
     */
    setNext(nextFeature: UiBehavior) {
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

    handleMouseMove(event: MouseEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleMouseMove(event, cell);
        } else {
            return cell;
        }
    }

    handleMouseExit(event: MouseEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleMouseExit(event, cell);
        } else {
            return cell;
        }
    }

    handleMouseEnter(event: MouseEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleMouseEnter(event, cell);
        } else {
            return cell;
        }
    }

    handleMouseDown(event: MouseEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleMouseDown(event, cell);
        } else {
            return cell;
        }
    }

    handleMouseUp(event: MouseEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleMouseUp(event, cell);
        } else {
            return cell;
        }
    }

    handleWheelMoved(event: WheelEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleWheelMoved(event, cell);
        } else {
            return cell;
        }
    }

    handleDoubleClick(event: MouseEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleDoubleClick(event, cell);
        } else {
            return cell;
        }
    }

    handleClick(event: MouseEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleClick(event, cell);
        } else {
            return cell;
        }
    }

    handleMouseDrag(event: MouseEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleMouseDrag(event, cell);
        } else {
            return cell;
        }
    }

    handleContextMenu(event: MouseEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
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

    handleScrollAction(action: ScrollAction) {
        if (this.next) {
            this.next.handleScrollAction(action);
        }
    }

    handleCopy(eventDetail: ClipboardEvent) {
        if (this.next) {
            this.next.handleCopy(eventDetail);
        }
    }

    initializeOn() {
        if (this.next) {
            this.next.initializeOn();
        }
    }

    protected tryGetViewCellFromMouseEvent(event: MouseEvent): ViewCell | null {
        const cell = this.viewLayout.findLeftGridLineInclusiveCellFromOffset(event.offsetX, event.offsetY);
        if (cell === undefined) {
            return null;
        } else {
            return cell;
        }

    }
}

export namespace UiBehavior {
    export type Constructor = new (services: UiBehaviorServices) => UiBehavior;
}
