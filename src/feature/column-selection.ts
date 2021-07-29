
import { ColumnProperties } from '../behaviors/column-properties';
import { Point } from '../dependencies/point';
import { Hypergrid } from '../grid/hypergrid';
import { Canvas } from '../lib/canvas';
import { CellEvent } from '../lib/cell-event';
import { ColumnMoving } from './column-moving';
import { Feature } from './feature';

export class ColumnSelection extends Feature {

    readonly typeName = ColumnSelection.typeName;

    /**
     * The pixel location of the mouse pointer during a drag operation.
     */
    currentDrag: Point = null;

    /**
     * The horizontal cell coordinate of the where the mouse pointer is during a drag operation.
     */
    lastDragColumn = -1 // null;

    /**
     * a millisecond value representing the previous time an autoscroll started
     */
    sbLastAuto = 0;

    /**
     * a millisecond value representing the time the current autoscroll started
     */
    sbAutoStart = 0;

    dragging = false;
    doubleClickTimer: ReturnType<typeof setTimeout>;


    override handleMouseUp(grid: Hypergrid, event: CellEvent) {
        if (this.dragging) {
            this.dragging = false;
        }
        if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    }

    override handleDoubleClick(grid: Hypergrid, event: CellEvent) {
        if (this.doubleClickTimer) {
            clearTimeout(this.doubleClickTimer); // prevent mouseDown from continuing
            this.doubleClickTimer = undefined;
        }
        if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    }

    override handleMouseDown(grid: Hypergrid, event: CellEvent) {
        if (this.doubleClickTimer) {
            return;
        }

        // todo: >= 5 depends on header being top-most row which is currently always true but we may allow header "section" to be arbitrary position within quadrant (see also handleMouseDown in ColumnMoving.js)
        if (
            grid.properties.columnSelection &&
            !event.primitiveEvent.detail.isRightClick &&
            (
                grid.properties.autoSelectColumns ||
                event.isHeaderCell && event.mousePoint.y >= 5
            )
        ) {
            // HOLD OFF WHILE WAITING FOR DOUBLE-CLICK
            this.doubleClickTimer = setTimeout(
                () => this.doubleClickTimerCallback(grid, event),
                this.doubleClickDelay(grid, event)
            );
        } else if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    }

    override handleMouseDrag(grid: Hypergrid, event: CellEvent) {
        if (
            grid.properties.columnSelection &&
            !this.isColumnDragging(grid) &&
            !event.primitiveEvent.detail.isRightClick &&
            this.dragging
        ) {
            //if we are in the fixed area do not apply the scroll values
            this.lastDragColumn = event.gridCell.x;
            this.currentDrag = event.primitiveEvent.detail.mouse;
            this.checkDragScroll(grid, this.currentDrag);
            this.handleMouseDragCellSelection(grid, this.lastDragColumn, event.primitiveEvent.detail.keys);
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    }

    override handleKeyDown(grid: Hypergrid, event: Canvas.KeyboardSyntheticEvent) {
        const detail = event.detail;
        const handler = grid.getLastSelectionType() === 'column' &&
                this['handle' + detail.char];

        if (handler) {
            handler(grid, detail);
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    }

    /**
     * @desc Handle a mousedrag selection
     * @param keys - array of the keys that are currently pressed down
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleMouseDragCellSelection(grid: Hypergrid, x: number, keys: string[]) {
        const mouseX = grid.getMouseDown().x;

        grid.clearMostRecentColumnSelection();

        grid.selectColumn(mouseX, x);
        grid.setDragExtent(grid.newPoint(x - mouseX, 0));

        grid.repaint();
    }

    /**
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     * @param {Hypergrid} grid
     */
    checkDragScroll(grid: Hypergrid, mouse: Point) {
        if (
            grid.properties.scrollingEnabled &&
            grid.getDataBounds().contains(mouse)
        ) {
            if (grid.isScrollingNow()) {
                grid.setScrollingNow(false);
            }
        } else {
            if (!grid.isScrollingNow()) {
                grid.setScrollingNow(true);
                this.scrollDrag(grid);
            }
        }
    }

    /**
     * @desc this function makes sure that while we are dragging outside of the grid visible bounds, we srcroll accordingly
     */
    scrollDrag(grid: Hypergrid) {
        if (!grid.isScrollingNow()) {
            return;
        }

        const b = grid.getDataBounds();
        let xOffset: number;

        if (this.currentDrag.x < b.origin.x) {
            xOffset = -1;
        } else if (this.currentDrag.x > b.origin.x + b.extent.x) {
            xOffset = 1;
        }

        if (xOffset) {
            if (this.lastDragColumn >= grid.getFixedColumnCount()) {
                this.lastDragColumn += xOffset;
            }
            grid.scrollBy(xOffset, 0);
        }

        this.handleMouseDragCellSelection(grid, this.lastDragColumn, []); // update the selection
        grid.repaint();
        setTimeout(() => this.scrollDrag(grid), 25);
    }

    /**
     * @desc extend a selection or create one if there isnt yet
     * @param keys - array of the keys that are currently pressed down
     */
    extendSelection(grid: Hypergrid, x: number, keys: string[]) {
        if (!grid.abortEditing()) { return; }

        const mouseX = grid.getMouseDown().x;
        const hasSHIFT = keys.indexOf('SHIFT') > 0;

        if (x < 0) { // outside of the grid?
            return; // do nothing
        }

        if (hasSHIFT) {
            grid.clearMostRecentColumnSelection();
            grid.selectColumn(x, mouseX);
            grid.setDragExtent(grid.newPoint(x - mouseX, 0));
        } else {
            grid.toggleSelectColumn(x, keys);
            grid.setMouseDown(grid.newPoint(x, 0));
            grid.setDragExtent(grid.newPoint(0, 0));
        }

        grid.repaint();
    }


    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    handleDOWNSHIFT(grid: Hypergrid) {

    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    handleUPSHIFT(grid: Hypergrid) {

    }

    handleLEFTSHIFT(grid: Hypergrid) {
        this.moveShiftSelect(grid, -1);
    }

    handleRIGHTSHIFT(grid: Hypergrid) {
        this.moveShiftSelect(grid, 1);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleDOWN(grid: Hypergrid) {

        // var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());
        // var maxRows = grid.getRowCount() - 1;

        // var newX = mouseCorner.x;
        // var newY = grid.getHeaderRowCount() + grid.getVScrollValue();

        // newY = Math.min(maxRows, newY);

        // grid.clearSelections();
        // grid.select(newX, newY, 0, 0);
        // grid.setMouseDown(new grid.rectangular.Point(newX, newY));
        // grid.setDragExtent(new grid.rectangular.Point(0, 0));

        // grid.repaint();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    handleUP(grid: Hypergrid) {

    }

    handleLEFT(grid: Hypergrid) {
        this.moveSingleSelect(grid, -1);
    }

    handleRIGHT(grid: Hypergrid) {
        this.moveSingleSelect(grid, 1);
    }

    /**
     * @desc If we are holding down the same navigation key, accelerate the increment we scroll
     */
    getAutoScrollAcceleration() {
        const elapsed = this.getAutoScrollDuration() / 2000;
        return Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
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
     */
    moveShiftSelect(grid: Hypergrid, offsetX: number) {
        const origin = grid.getMouseDown();
        const extent = grid.getDragExtent();
        let newX = extent.x + offsetX;
        const maxViewableColumns = grid.renderer.visibleColumns.length - 1;
        let maxColumns = grid.getColumnCount() - 1;

        if (!grid.properties.scrollingEnabled) {
            maxColumns = Math.min(maxColumns, maxViewableColumns);
        }

        newX = Math.min(maxColumns - origin.x, Math.max(-origin.x, newX));

        grid.clearMostRecentColumnSelection();
        grid.selectColumn(origin.x, origin.x + newX);
        grid.setDragExtent(grid.newPoint(newX, 0));

        if (grid.insureModelColIsVisible(newX + origin.x, offsetX)) {
            this.pingAutoScroll();
        }

        grid.repaint();
    }

    /**
     * @desc Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
     * @param offsetX - x coordinate to start at
     */
    override moveSingleSelect(grid: Hypergrid, offsetX: number) {
        const extent = grid.getDragExtent();
        const mouseCorner = Point.plus(grid.getMouseDown(), extent);
        let newX = mouseCorner.x + offsetX;
        let maxColumns = grid.getColumnCount() - 1;
        const maxViewableColumns = grid.getVisibleColumnsCount() - 1;

        if (!grid.properties.scrollingEnabled) {
            maxColumns = Math.min(maxColumns, maxViewableColumns);
        }

        newX = Math.min(maxColumns, Math.max(0, newX));

        grid.clearSelections();
        grid.selectColumn(newX);
        grid.setMouseDown(grid.newPoint(newX, 0));
        grid.setDragExtent(grid.newPoint(0, 0));

        if (grid.insureModelColIsVisible(newX, offsetX)) {
            this.pingAutoScroll();
        }

        grid.repaint();
    }

    isColumnDragging(grid: Hypergrid) {
        const dragger = grid.lookupFeature('ColumnMoving') as ColumnMoving;
        return dragger && (dragger.dragging || dragger.dragArmed); //&& !this.dragging;
    }

    private doubleClickDelay(grid: Hypergrid, event: CellEvent) {
        let columnProperties: ColumnProperties;

        return (
            event.isHeaderCell &&
            !(columnProperties = event.columnProperties).unsortable &&
            columnProperties.sortOnDoubleClick &&
            300
        );
    }

    private doubleClickTimerCallback(grid: Hypergrid, event: CellEvent) {
        this.doubleClickTimer = undefined;
        this.dragging = true;
        this.extendSelection(grid, event.gridCell.x, event.primitiveEvent.detail.keys);
    }
}

export namespace ColumnSelection {
    export const typeName = 'columnselection';
}
