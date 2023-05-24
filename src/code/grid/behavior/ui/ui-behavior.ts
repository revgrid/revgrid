
import { CanvasManager } from '../../components/canvas/canvas-manager';
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
import { CellPropertiesBehavior } from '../component/cell-properties-behavior';
import { DataExtractBehavior } from '../component/data-extract-behavior';
import { EventBehavior } from '../component/event-behavior';
import { FocusScrollBehavior } from '../component/focus-scroll-behavior';
import { FocusSelectBehavior } from '../component/focus-select-behavior';
import { RowPropertiesBehavior } from '../component/row-properties-behavior';
import { UiBehaviorServices } from './ui-behavior-services';
import { UiBehaviorSharedState } from './ui-behavior-shared-state';

/**
 * Instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 * @internal
 */
export abstract class UiBehavior {
    abstract readonly typeName: string;

    protected readonly sharedState: UiBehaviorSharedState;
    protected readonly containerHtmlElement: HTMLElement;

    protected readonly gridSettings: GridSettings;
    protected readonly canvasManager: CanvasManager;
    protected readonly selection: Selection;
    protected readonly focus: Focus;
    protected readonly columnsManager: ColumnsManager;
    protected readonly subgridsManager: SubgridsManager;
    protected readonly viewLayout: ViewLayout;
    protected readonly renderer: Renderer;
    protected readonly reindexStashManager: ReindexStashManager;

    protected readonly mouse: Mouse;

    protected readonly focusScrollBehavior: FocusScrollBehavior;
    protected readonly focusSelectBehavior: FocusSelectBehavior;
    protected readonly rowPropertiesBehavior: RowPropertiesBehavior;
    protected readonly cellPropertiesBehavior: CellPropertiesBehavior;
    protected readonly dataExtractBehavior: DataExtractBehavior;
    protected readonly eventBehavior: EventBehavior;

    protected readonly mainSubgrid: Subgrid;

    constructor(services: UiBehaviorServices) {
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
        this.reindexStashManager = services.reindexStashManager;

        this.mouse = services.mouse;

        this.focusScrollBehavior = services.focusScrollBehavior;
        this.focusSelectBehavior = services.focusSelectBehavior;
        this.rowPropertiesBehavior = services.rowPropertiesBehavior;
        this.cellPropertiesBehavior = services.cellPropertiesBehavior;
        this.dataExtractBehavior = services.dataExtractBehavior;
        this.eventBehavior = services.eventBehavior;
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

    handleWheelMove(event: WheelEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleWheelMove(event, cell);
        } else {
            return cell;
        }
    }

    handleDblClick(event: MouseEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleDblClick(event, cell);
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

    handleDrag(event: DragEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleDrag(event, cell);
        } else {
            return cell;
        }
    }

    handleDragStart(event: DragEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleDragStart(event, cell);
        } else {
            return cell;
        }
    }

    handleDragEnter(event: DragEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleDragEnter(event, cell);
        } else {
            return cell;
        }
    }

    handleDragOver(event: DragEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleDragOver(event, cell);
        } else {
            return cell;
        }
    }

    handleDragLeave(event: DragEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleDragLeave(event, cell);
        } else {
            return cell;
        }
    }

    handleDragEnd(event: DragEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleDragEnd(event, cell);
        } else {
            return cell;
        }
    }

    handleDrop(event: DragEvent, cell: ViewCell | null | undefined): ViewCell | null | undefined {
        if (this.next) {
            return this.next.handleDrop(event, cell);
        } else {
            return cell;
        }
    }

    handleDocumentDragOver(event: DragEvent) {
        if (this.next) {
            this.next.handleDocumentDragOver(event);
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

    protected tryGetViewCellFromMouseEvent(event: MouseEvent): ViewCell | null {
        const cell = this.viewLayout.findLeftGridLineInclusiveCellFromCanvasOffset(event.offsetX, event.offsetY);
        if (cell === undefined) {
            return null;
        } else {
            return cell;
        }

    }
}

/** @internal */
export namespace UiBehavior {
    export type Constructor = new (services: UiBehaviorServices) => UiBehavior;
}
