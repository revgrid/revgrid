
import { CanvasEx } from '../../canvas/canvas-ex';
import { CellEvent } from '../../cell/cell-event';
import { ViewportCell } from '../../cell/viewport-cell';
import { ColumnsManager } from '../../column/columns-manager';
import { EventDetail } from '../../event/event-detail';
import { Focus } from '../../focus';
import { GridProperties } from '../../grid-properties';
import { Point } from '../../lib/point';
import { Renderer } from '../../renderer/renderer';
import { Viewport } from '../../renderer/viewport';
import { Revgrid } from '../../revgrid';
import { Selection } from '../../selection/selection';
import { SubgridsManager } from '../../subgrid/subgrids-manager';
import { Mouse } from '../../user-interface-input/mouse';
import { CellPropertiesBehavior } from '../cell-properties-behavior';
import { EventBehavior } from '../event-behavior';
import { FocusSelectionBehavior } from '../focus-selection-behavior';
import { RowPropertiesBehavior } from '../row-properties-behavior';
import { ScrollBehavior } from '../scroll-behaviour';
import { UserInterfaceInputBehavior } from '../user-interface-input-behavior';
import { UiBehaviorServices } from './ui-behavior-services';
import { UiBehaviorSharedState } from './ui-behavior-shared-state';

/**
 * Instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 */
export abstract class UiBehavior {

    abstract readonly typeName: string;

    protected readonly focusSelectionBehavior: FocusSelectionBehavior;
    protected readonly userInterfaceInputBehavior: UserInterfaceInputBehavior;
    protected readonly scrollBehavior: ScrollBehavior;
    protected readonly rowPropertiesBehavior: RowPropertiesBehavior;
    protected readonly cellPropertiesBehavior: CellPropertiesBehavior;
    protected readonly eventBehavior: EventBehavior;

    protected readonly sharedState: UiBehaviorSharedState;
    protected readonly mouse: Mouse;
    protected readonly canvasEx: CanvasEx;
    protected readonly selection: Selection;
    protected readonly focus: Focus;
    protected readonly columnsManager: ColumnsManager;
    protected readonly subgridsManager: SubgridsManager;
    protected readonly viewport: Viewport;
    protected readonly renderer: Renderer;
    protected readonly gridProperties: GridProperties;

    constructor(
        protected readonly grid: Revgrid,
        services: UiBehaviorServices,
    ) {
        this.focusSelectionBehavior = services.focusSelectionBehavior;
        this.userInterfaceInputBehavior = services.userInterfaceInputBehavior;
        this.scrollBehavior = services.scrollBehavior;
        this.rowPropertiesBehavior = services.rowPropertiesBehavior;
        this.cellPropertiesBehavior = services.cellPropertiesBehavior;
        this.eventBehavior = services.eventBehavior;

        this.sharedState = services.sharedState;
        this.mouse = services.mouse;
        this.canvasEx = services.canvasEx;
        this.selection = services.selection;
        this.focus = services.focus;
        this.columnsManager = services.columnsManager;
        this.subgridsManager = services.subgridsManager;
        this.viewport = services.viewport;
        this.renderer = services.renderer;
        this.gridProperties = services.gridProperties;
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

    /**
     * @desc handle mouse move down the feature chain of responsibility
     */
    handleMouseMove(event: MouseEvent, cell: ViewportCell | null | undefined): ViewportCell | null | undefined {
        if (this.next) {
            return this.next.handleMouseMove(event, cell);
        } else {
            return cell;
        }
    }

    handleMouseExit(event: MouseEvent, cell: ViewportCell | null | undefined): ViewportCell | null | undefined {
        if (this.next) {
            return this.next.handleMouseExit(event, cell);
        } else {
            return cell;
        }
    }

    handleMouseEnter(event: MouseEvent, cell: ViewportCell | null | undefined): ViewportCell | null | undefined {
        if (this.next) {
            return this.next.handleMouseEnter(event, cell);
        } else {
            return cell;
        }
    }

    handleMouseDown(event: MouseEvent, cell: ViewportCell | null | undefined): ViewportCell | null | undefined {
        if (this.next) {
            return this.next.handleMouseDown(event, cell);
        } else {
            return cell;
        }
    }

    handleMouseUp(event: MouseEvent, cell: ViewportCell | null | undefined): ViewportCell | null | undefined {
        if (this.next) {
            return this.next.handleMouseUp(event, cell);
        } else {
            return cell;
        }
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

    handleWheelMoved(event: WheelEvent, cell: ViewportCell | null | undefined): ViewportCell | null | undefined {
        if (this.next) {
            return this.next.handleWheelMoved(event, cell);
        } else {
            return cell;
        }
    }

    handleDoubleClick(event: MouseEvent, cell: ViewportCell | null | undefined): ViewportCell | null | undefined {
        if (this.next) {
            return this.next.handleDoubleClick(event, cell);
        } else {
            return cell;
        }
    }

    handleClick(event: MouseEvent, cell: ViewportCell | null | undefined): ViewportCell | null | undefined {
        if (this.next) {
            return this.next.handleClick(event, cell);
        } else {
            return cell;
        }
    }

    handleMouseDrag(event: MouseEvent, cell: ViewportCell | null | undefined): ViewportCell | null | undefined {
        if (this.next) {
            return this.next.handleMouseDrag(event, cell);
        } else {
            return cell;
        }
    }

    handleContextMenu(event: MouseEvent, cell: ViewportCell | null | undefined): ViewportCell | null | undefined {
        if (this.next) {
            return this.next.handleContextMenu(event, cell);
        } else {
            return cell;
        }
    }

    handleTouchStart(eventDetail: EventDetail.Touch) {
        if (this.next) {
            this.next.handleTouchStart(eventDetail);
        }
    }

    handleTouchMove(eventDetail: EventDetail.Touch) {
        if (this.next) {
            this.next.handleTouchMove(eventDetail);
        }
    }

    handleTouchEnd(eventDetail: EventDetail.Touch) {
        if (this.next) {
            this.next.handleTouchEnd(eventDetail);
        }
    }

    isFirstFixedRow(event: CellEvent) {
        return event.gridCell.y < 1;
    }

    isFirstFixedColumn(event: CellEvent) {
        return event.gridCell.x === 0;
    }

    setCursor() {
        if (this.next !== undefined) {
            this.next.setCursor();
        }
        if (this.cursor !== undefined) {
            this.grid.beCursor(this.cursor);
        }
    }

    initializeOn() {
        if (this.next) {
            this.next.initializeOn();
        }
    }

    protected tryGetViewportCellFromMouseEvent(event: MouseEvent): ViewportCell | null {
        const cell = this.viewport.findLeftGridLineInclusiveCellFromOffset(event.offsetX, event.offsetY);
        if (cell === undefined) {
            return null;
        } else {
            return cell;
        }

    }
}

export namespace UiBehavior {
    export type Constructor = new (grid: Revgrid, services: UiBehaviorServices) => UiBehavior;
}
