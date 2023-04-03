
import { CellEvent, MouseCellEvent } from '../cell/cell-event';
import { ColumnsManager } from '../column/columns-manager';
import { EventDetail } from '../event/event-detail';
import { Focus } from '../focus';
import { GridProperties } from '../grid-properties';
import { Point } from '../lib/point';
import { Renderer } from '../renderer/renderer';
import { Revgrid } from '../revgrid';
import { Selection } from '../selection/selection';
import { FeatureServices } from './feature-services';
import { FeaturesSharedState } from './features-shared-state';

/**
 * Instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 */
export abstract class Feature {

    abstract readonly typeName: string;

    protected readonly sharedState: FeaturesSharedState;
    protected readonly selection: Selection;
    protected readonly focus: Focus;
    protected readonly columnsManager: ColumnsManager;
    protected readonly renderer: Renderer;
    protected readonly gridProperties: GridProperties;

    constructor(
        protected readonly grid: Revgrid,
        services: FeatureServices,
    ) {
        this.sharedState = services.sharedState;
        this.selection = services.selection;
        this.focus = services.focus;
        this.columnsManager = services.columnsManager;
        this.renderer = services.renderer;
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

    /**
     * @desc toggle the column picker
     */
    moveSingleSelect(x: number, shift?: boolean) {
        if (this.next) {
            this.next.moveSingleSelect(x, shift);
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
    export type Constructor = new (grid: Revgrid, services: FeatureServices) => Feature;
}
