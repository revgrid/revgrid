
import { Point } from '../dependencies/point';
import { Hypergrid } from '../grid/hypergrid';
import { Canvas } from '../lib/canvas';
import { CellEvent } from '../lib/cell-event';

/**
 * Instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 */
export abstract class Feature {

    abstract readonly typeName: string;

    /**
     * the next feature to be given a chance to handle incoming events
     */
    next: Feature | null = null;

    /**
     * a temporary holding field for my next feature when I'm in a disconnected state
     */
    detached: Feature | null = null;

    /**
     * the cursor I want to be displayed
     */
    cursor: string | null = null;

    /**
     * the cell location where the cursor is currently
     */
    currentHoverCell: Point | null = null;

    /**
     * @desc set my next field, or if it's populated delegate to the feature in my next field
     * @param nextFeature - this is how we build the chain of responsibility
     */
    setNext(nextFeature: Feature) {
        if (this.next !== null) {
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
        this.next = null;
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
    handleMouseMove(grid: Hypergrid, event: CellEvent | undefined) {
        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    }

    handleMouseExit(grid: Hypergrid, event: CellEvent) {
        if (this.next) {
            this.next.handleMouseExit(grid, event);
        }
    }

    handleMouseEnter(grid: Hypergrid, event: CellEvent) {
        if (this.next) {
            this.next.handleMouseEnter(grid, event);
        }
    }

    handleMouseDown(grid: Hypergrid, event: CellEvent) {
        if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    }

    handleMouseUp(grid: Hypergrid, event: CellEvent) {
        if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    }

    handleKeyDown(grid: Hypergrid, event: Canvas.KeyboardSyntheticEvent) {
        if (this.next) {
            this.next.handleKeyDown(grid, event);
        // } else {
        //     return true;
        }
    }

    handleKeyUp(grid: Hypergrid, event: Canvas.KeyboardSyntheticEvent) {
        if (this.next) {
            this.next.handleKeyUp(grid, event);
        }
    }

    handleWheelMoved(grid: Hypergrid, event: CellEvent) {
        if (this.next) {
            this.next.handleWheelMoved(grid, event);
        }
    }

    handleDoubleClick(grid: Hypergrid, event: CellEvent) {
        if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    }

    handleClick(grid: Hypergrid, event: CellEvent) {
        if (this.next) {
            this.next.handleClick(grid, event);
        }
    }

    handleMouseDrag(grid: Hypergrid, event: CellEvent) {
        if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    }

    handleContextMenu(grid: Hypergrid, event: CellEvent) {
        if (this.next) {
            this.next.handleContextMenu(grid, event);
        }
    }

    handleTouchStart(grid: Hypergrid, event: Canvas.TouchSyntheticEvent) {
        if (this.next) {
            this.next.handleTouchStart(grid, event);
        }
    }

    handleTouchMove(grid: Hypergrid, event: Canvas.TouchSyntheticEvent) {
        if (this.next) {
            this.next.handleTouchMove(grid, event);
        }
    }

    handleTouchEnd(grid: Hypergrid, event: Canvas.TouchSyntheticEvent) {
        if (this.next) {
            this.next.handleTouchEnd(grid, event);
        }
    }

    /**
     * @desc toggle the column picker
     */
    moveSingleSelect(grid: Hypergrid, x: number, shift?: boolean) {
        if (this.next) {
            this.next.moveSingleSelect(grid, x, shift);
        }
    }

    isFirstFixedRow(grid: Hypergrid, event: CellEvent) {
        return event.gridCell.y < 1;
    }

    isFirstFixedColumn(grid: Hypergrid, event: CellEvent) {
        return event.gridCell.x === 0;
    }

    setCursor(grid: Hypergrid) {
        if (this.next) {
            this.next.setCursor(grid);
        }
        if (this.cursor) {
            grid.beCursor(this.cursor);
        }
    }

    initializeOn(grid: Hypergrid) {
        if (this.next) {
            this.next.initializeOn(grid);
        }
    }
}

export namespace Feature {
    export type Constructor = new () => Feature;
}
