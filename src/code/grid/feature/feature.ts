
import { Behavior } from '../behavior/behavior';
import { CellPropertiesBehavior } from '../behavior/cell-properties-behavior';
import { EventBehavior } from '../behavior/event-behavior';
import { FocusSelectionBehavior } from '../behavior/focus-selection-behavior';
import { RendererBehavior } from '../behavior/renderer-behaviour';
import { RowPropertiesBehavior } from '../behavior/row-properties-behavior';
import { ScrollBehavior } from '../behavior/scroll-behaviour';
import { UserInterfaceInputBehavior } from '../behavior/user-interface-input-behavior';
import { CanvasEx } from '../canvas/canvas-ex';
import { CellEvent, MouseCellEvent } from '../cell/cell-event';
import { ColumnsManager } from '../column/columns-manager';
import { EventDetail } from '../event/event-detail';
import { Focus } from '../focus';
import { GridProperties } from '../grid-properties';
import { Point } from '../lib/point';
import { Viewport } from '../renderer/viewport';
import { Revgrid } from '../revgrid';
import { Selection } from '../selection/selection';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { FeatureServices } from './feature-services';
import { FeaturesSharedState } from './features-shared-state';

/**
 * Instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 */
export abstract class Feature {

    abstract readonly typeName: string;

    protected readonly focusSelectionBehavior: FocusSelectionBehavior;
    protected readonly rendererBehavior: RendererBehavior;
    protected readonly userInterfaceInputBehavior: UserInterfaceInputBehavior;
    protected readonly scrollBehavior: ScrollBehavior;
    protected readonly rowPropertiesBehavior: RowPropertiesBehavior;
    protected readonly cellPropertiesBehavior: CellPropertiesBehavior;
    protected readonly eventBehavior: EventBehavior;

    protected readonly sharedState: FeaturesSharedState;
    protected readonly canvas: CanvasEx;
    protected readonly selection: Selection;
    protected readonly focus: Focus;
    protected readonly columnsManager: ColumnsManager;
    protected readonly subgridsManager: SubgridsManager;
    protected readonly viewport: Viewport;
    protected readonly gridProperties: GridProperties;

    constructor(
        protected readonly behavior: Behavior,
        protected readonly grid: Revgrid,
        services: FeatureServices,
    ) {
        this.focusSelectionBehavior = behavior.focusSelectionBehavior;
        this.rendererBehavior = behavior.rendererBehavior;
        this.userInterfaceInputBehavior = behavior.userInterfaceInputBehavior;
        this.scrollBehavior = behavior.scrollBehavior;
        this.rowPropertiesBehavior = behavior.rowPropertiesBehavior;
        this.cellPropertiesBehavior = behavior.cellPropertiesBehavior;
        this.eventBehavior = behavior.eventBehavior;

        this.sharedState = services.sharedState;
        this.canvas = services.canvasEx;
        this.selection = services.selection;
        this.focus = services.focus;
        this.columnsManager = services.columnsManager;
        this.subgridsManager = services.subgridsManager;
        this.viewport = services.renderer;
        this.gridProperties = services.gridProperties;
    }

    /**
     * the next feature to be given a chance to handle incoming events
     */
    next: Feature | undefined;

    /**
     * a temporary holding field for my next feature when I'm in a disconnected state
     */
    detached: Feature | undefined;

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
    setNext(nextFeature: Feature) {
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
    handleMouseMove(event: MouseCellEvent | undefined) {
        if (this.next) {
            this.next.handleMouseMove(event);
        }
    }

    handleMouseExit(event: MouseCellEvent) {
        if (this.next) {
            this.next.handleMouseExit(event);
        }
    }

    handleMouseEnter(event: MouseCellEvent) {
        if (this.next) {
            this.next.handleMouseEnter(event);
        }
    }

    handleMouseDown(event: MouseCellEvent) {
        if (this.next) {
            this.next.handleMouseDown(event);
        }
    }

    handleMouseUp(event: MouseCellEvent) {
        if (this.next) {
            this.next.handleMouseUp(event);
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

    handleWheelMoved(event: MouseCellEvent) {
        if (this.next) {
            this.next.handleWheelMoved(event);
        }
    }

    handleDoubleClick(event: MouseCellEvent) {
        if (this.next) {
            this.next.handleDoubleClick(event);
        }
    }

    handleClick(event: MouseCellEvent) {
        if (this.next) {
            this.next.handleClick(event);
        }
    }

    handleMouseDrag(event: MouseCellEvent) {
        if (this.next) {
            this.next.handleMouseDrag(event);
        }
    }

    handleContextMenu(event: MouseCellEvent) {
        if (this.next) {
            this.next.handleContextMenu(event);
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
}

export namespace Feature {
    export type Constructor = new (behavior: Behavior, grid: Revgrid, services: FeatureServices) => Feature;
}
