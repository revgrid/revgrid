
import { Point } from '../dependencies/point';
import { Hypergrid } from '../grid/hypergrid';
import { HypergridProperties } from '../grid/hypergrid-properties';
import { Canvas } from '../lib/canvas';
import { CellEvent } from '../lib/cell-event';
import { Feature } from './feature';

export class CellSelection extends Feature {

    readonly typeName = CellSelection.typeName;

    /**
     * The pixel location of the mouse pointer during a drag operation.
     */
    currentDrag: Point;

    /**
     * the cell coordinates of the where the mouse pointer is during a drag operation
     */
    lastDragCell: Point;

    /**
     * a millisecond value representing the previous time an autoscroll started
     */
    sbLastAuto = 0;

    /**
     * a millisecond value representing the time the current autoscroll started
     */
    sbAutoStart = 0;
    dragging: boolean;

    override handleMouseUp(grid: Hypergrid, event: CellEvent) {
        if (this.dragging) {
            this.dragging = false;
        }
        if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    }

    override handleMouseDown(grid: Hypergrid, event: CellEvent) {
        const dx = event.gridCell.x;
        const dy = event.dataCell.y;
        const isSelectable = grid.behavior.getCellProperty(event.dataCell.x, event.gridCell.y, 'cellSelection', event.subgrid);

        if (isSelectable && event.isDataCell && !event.primitiveEvent.detail.isRightClick) {
            const dCell = grid.newPoint(dx, dy);
            const primEvent = event.primitiveEvent;
            const keys = primEvent.detail.keys;
            this.dragging = true;
            this.extendSelection(grid, dCell, keys);
        } else if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    }

    override handleMouseDrag(grid: Hypergrid, event: CellEvent) {
        if (this.dragging && grid.properties.cellSelection && !event.primitiveEvent.detail.isRightClick) {
            this.currentDrag = event.primitiveEvent.detail.mouse;
            this.lastDragCell = grid.newPoint(event.gridCell.x, event.dataCell.y);
            this.checkDragScroll(grid, this.currentDrag);
            this.handleMouseDragCellSelection(grid, this.lastDragCell, event.primitiveEvent.detail.keys);
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    }

    /**
     * @param event - the event details
     */
    override handleKeyDown(grid: Hypergrid, event: Canvas.KeyboardSyntheticEvent) {
        const detail = event.detail;
        const cellEvent = grid.getGridCellFromLastSelection(true);
        const navKey = cellEvent && (
                HypergridProperties.mappedNavKey(cellEvent.columnProperties, detail.char, detail.ctrl) ||
                HypergridProperties.navKey(cellEvent.columnProperties, detail.char, detail.ctrl)
            );
        const handler = this['handle' + navKey];


        // STEP 1: Move the selection
        if (handler) {
            handler.call(this, grid, detail);

            // STEP 2: Open the cell editor at the new position if `editable` AND edited cell had `editOnNextCell`
            if (cellEvent.columnProperties.editOnNextCell) {
                grid.renderer.computeCellsBounds(true); // moving selection may have auto-scrolled
                const cellEvent = grid.getGridCellFromLastSelection(false); // new cell
                grid.editAt(cellEvent); // succeeds only if `editable`
            }

            // STEP 3: If editor not opened on new cell, take focus
            if (!grid.cellEditor) {
                grid.takeFocus();
            }
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    }

    /**
     * @desc Handle a mousedrag selection.
     * @param keys - array of the keys that are currently pressed down
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleMouseDragCellSelection(grid: Hypergrid, gridCell: Point, keys: string[]) {
        const x = Math.max(0, gridCell.x);
        const y = Math.max(0, gridCell.y);
        const previousDragExtent = grid.getDragExtent();
        const mouseDown = grid.getMouseDown();
        const newX = x - mouseDown.x;
        const newY = y - mouseDown.y;

        if (previousDragExtent.x === newX && previousDragExtent.y === newY) {
            return;
        }

        grid.clearMostRecentSelection();

        grid.select(mouseDown.x, mouseDown.y, newX, newY);
        grid.setDragExtent(grid.newPoint(newX, newY));

        grid.repaint();
    }

    /**
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     */
    checkDragScroll(grid: Hypergrid, mouse: Point) {
        if (!grid.properties.scrollingEnabled) {
            return;
        }
        const b = grid.getDataBounds();
        const inside = b.contains(mouse);
        if (inside) {
            if (grid.isScrollingNow()) {
                grid.setScrollingNow(false);
            }
        } else if (!grid.isScrollingNow()) {
            grid.setScrollingNow(true);
            this.scrollDrag(grid);
        }
    }

    /**
     * @desc this function makes sure that while we are dragging outside of the grid visible bounds, we srcroll accordingly
     */
    scrollDrag(grid: Hypergrid) {
        if (!grid.isScrollingNow()) {
            return;
        }

        const dragStartedInHeaderArea = grid.isMouseDownInHeaderArea();
        const lastDragCell = this.lastDragCell;
        const b = grid.getDataBounds();

        let xOffset = 0;
        let yOffset = 0;

        const numFixedColumns = grid.getFixedColumnCount();
        const numFixedRows = grid.getFixedRowCount();

        const dragEndInFixedAreaX = lastDragCell.x < numFixedColumns;
        const dragEndInFixedAreaY = lastDragCell.y < numFixedRows;

        if (!dragStartedInHeaderArea) {
            if (this.currentDrag.x < b.origin.x) {
                xOffset = -1;
            }
            if (this.currentDrag.y < b.origin.y) {
                yOffset = -1;
            }
        }
        if (this.currentDrag.x > b.origin.x + b.extent.x) {
            xOffset = 1;
        }
        if (this.currentDrag.y > b.origin.y + b.extent.y) {
            yOffset = 1;
        }

        let dragCellOffsetX = xOffset;
        let dragCellOffsetY = yOffset;

        if (dragEndInFixedAreaX) {
            dragCellOffsetX = 0;
        }
        if (dragEndInFixedAreaY) {
            dragCellOffsetY = 0;
        }

        this.lastDragCell = Point.plusXY(lastDragCell, dragCellOffsetX, dragCellOffsetY);
        grid.scrollBy(xOffset, yOffset);
        this.handleMouseDragCellSelection(grid, lastDragCell, []); // update the selection
        grid.repaint();
        setTimeout(this.scrollDrag.bind(this, grid), 25);
    }

    /**
     * @desc extend a selection or create one if there isnt yet
     * @param {Array} keys - array of the keys that are currently pressed down
     */
    extendSelection(grid: Hypergrid, gridCell: Point, keys: string[]) {
        const hasCTRL = keys.indexOf('CTRL') >= 0;
        const hasSHIFT = keys.indexOf('SHIFT') >= 0;
        const mousePoint = grid.getMouseDown();
        const x = gridCell.x; // - numFixedColumns + scrollLeft;
        const y = gridCell.y; // - numFixedRows + scrollTop;

        //were outside of the grid do nothing
        if (x < 0 || y < 0) {
            return;
        }

        //we have repeated a click in the same spot deslect the value from last time
        if (
            hasCTRL &&
            x === mousePoint.x &&
            y === mousePoint.y
        ) {
            grid.clearMostRecentSelection();
            grid.popMouseDown();
            grid.repaint();
            return;
        }

        if (!hasCTRL && !hasSHIFT) {
            grid.clearSelections();
        }

        if (hasSHIFT) {
            grid.clearMostRecentSelection();
            grid.select(mousePoint.x, mousePoint.y, x - mousePoint.x, y - mousePoint.y);
            grid.setDragExtent(grid.newPoint(x - mousePoint.x, y - mousePoint.y));
        } else {
            grid.select(x, y, 0, 0);
            grid.setMouseDown(grid.newPoint(x, y));
            grid.setDragExtent(grid.newPoint(0, 0));
        }
        grid.repaint();
    }


    handleDOWNSHIFT(grid: Hypergrid) {
        this.moveShiftSelect(grid, 0, 1);
    }

    handleUPSHIFT(grid: Hypergrid) {
        this.moveShiftSelect(grid, 0, -1);
    }

    handleLEFTSHIFT(grid: Hypergrid) {
        this.moveShiftSelect(grid, -1, 0);
    }

    handleRIGHTSHIFT(grid: Hypergrid) {
        this.moveShiftSelect(grid, 1, 0);
    }

    handleDOWN(grid: Hypergrid, event: CellEvent) {
        //keep the browser viewport from auto scrolling on key event
        event.primitiveEvent.preventDefault();

        const count = this.getAutoScrollAcceleration();
        grid.moveSingleSelect(0, count);
    }

    handleUP(grid: Hypergrid, event: CellEvent) {
        //keep the browser viewport from auto scrolling on key event
        event.primitiveEvent.preventDefault();

        const count = this.getAutoScrollAcceleration();
        grid.moveSingleSelect(0, -count);
    }

    handleLEFT(grid: Hypergrid) {
        grid.moveSingleSelect(-1, 0);
    }

    handleRIGHT(grid: Hypergrid) {
        grid.moveSingleSelect(1, 0);
    }

    /**
     * @desc If we are holding down the same navigation key, accelerate the increment we scroll
     */
    getAutoScrollAcceleration() {
        const elapsed = this.getAutoScrollDuration() / 2000;
        const count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
        return count;
    }

    /**
     * @desc set the start time to right now when we initiate an auto scroll
     */
    setAutoScrollStartTime() {
        this.sbAutoStart = Date.now();
    }

    /**
     * @desc update the autoscroll start time if we haven't autoscrolled within the last 500ms otherwise update the current autoscroll time
     */
    pingAutoScroll() {
        const now = Date.now();
        if (now - this.sbLastAuto > 500) {
            this.setAutoScrollStartTime();
        }
        this.sbLastAuto = Date.now();
    }

    /**
     * @desc answer how long we have been auto scrolling
     */
    getAutoScrollDuration() {
        if (Date.now() - this.sbLastAuto > 500) {
            return 0;
        }
        return Date.now() - this.sbAutoStart;
    }

    /**
     * @desc Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
     * @param offsetX - x coordinate to start at
     * @param offsetY - y coordinate to start at
     */
    moveShiftSelect(grid: Hypergrid, offsetX: number, offsetY: number) {
        if (grid.extendSelect(offsetX, offsetY)) {
            this.pingAutoScroll();
        }
    }

}

export namespace CellSelection {
    export const typeName = 'cellselection';
}
