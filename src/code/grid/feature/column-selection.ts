import { CellEvent, MouseCellEvent } from '../cell/cell-event';
import { EventDetail } from '../event/event-detail';
import { Feature } from '../feature/feature';
import { Point } from '../lib/point';
import { AssertError } from '../lib/revgrid-error';
import { SelectionArea } from '../lib/selection-area';
import { ColumnMoving } from './column-moving';

export class ColumnSelection extends Feature {

    readonly typeName = ColumnSelection.typeName;

    /**
     * The pixel location of the mouse pointer during a drag operation.
     */
    private _currentDrag: Point;

    /**
     * The horizontal cell coordinate of the where the mouse pointer is during a drag operation.
     */
    private _lastDragColumn = -1 // null;

    /**
     * a millisecond value representing the previous time an autoscroll started
     */
    private _sbLastAuto = 0;

    /**
     * a millisecond value representing the time the current autoscroll started
     */
    private _sbAutoStart = 0;

    private _dragging = false;
    private _doubleClickTimer: ReturnType<typeof setTimeout> | undefined;


    override handleMouseUp(event: MouseCellEvent) {
        if (this._dragging) {
            this._dragging = false;
        }
        if (this.next) {
            this.next.handleMouseUp(event);
        }
    }

    override handleDoubleClick(event: MouseCellEvent) {
        if (this._doubleClickTimer !== undefined) {
            clearTimeout(this._doubleClickTimer); // prevent mouseDown from continuing
            this._doubleClickTimer = undefined;
        }
        if (this.next) {
            this.next.handleDoubleClick(event);
        }
    }

    override handleMouseDown(event: MouseCellEvent) {
        if (this._doubleClickTimer !== undefined) {
            return;
        }

        // todo: >= 5 depends on header being top-most row which is currently always true but we may allow header "section" to be arbitrary position within quadrant (see also handleMouseDown in ColumnMoving.js)
        const grid = this.grid;
        if (
            grid.properties.columnSelection &&
            !event.mouse.isRightClick &&
            (
                grid.properties.autoSelectColumns ||
                event.isHeaderCell
            )
        ) {
            // HOLD OFF WHILE WAITING FOR DOUBLE-CLICK
            this._doubleClickTimer = setTimeout(
                () => this.doubleClickTimerCallback(event),
                this.doubleClickDelay(event)
            );
        } else {
            super.handleMouseDown(event);
        }
    }

    override handleMouseDrag(event: MouseCellEvent) {
        const grid = this.grid;
        if (
            grid.properties.columnSelection &&
            !this.isColumnDragging() &&
            !event.mouse.isRightClick &&
            this._dragging
        ) {
            //if we are in the fixed area do not apply the scroll values
            this._lastDragColumn = event.gridCell.x;
            this._currentDrag = event.mouse.mouse;
            this.checkDragScroll(this._currentDrag);
            this.handleMouseDragCellSelection(this._lastDragColumn);
        } else if (this.next) {
            this.next.handleMouseDrag(event);
        }
    }

    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        const lastSelectionType = this.focusSelectionBehavior.getLastSelectionType();
        if (lastSelectionType !== SelectionArea.Type.Column) {
            super.handleKeyDown(eventDetail);
        } else {
            const handler = this[('handle' + eventDetail.primitiveEvent.key) as keyof ColumnSelection] as (() => void);
            if (handler === undefined) {
                super.handleKeyDown(eventDetail);
            } else {
                handler.call(this);
            }
        }
    }

    /**
     * @desc Handle a mousedrag selection
     * @param keys - array of the keys that are currently pressed down
     */
    handleMouseDragCellSelection(x: number) {
        const userInterfaceInputBehavior = this.userInterfaceInputBehavior;
        const mouseDown = userInterfaceInputBehavior.getMouseDown();
        if (mouseDown === undefined) {
            throw new AssertError('CSHMDCS54455');
        } else {
            const mouseX = mouseDown.x;

            const selectionBehavior = this.focusSelectionBehavior;
            selectionBehavior.clearMostRecentColumnSelection();

            selectionBehavior.focusSelectColumns(mouseX, x);
            this.userInterfaceInputBehavior.setDragExtent(Point.create(x - mouseX, 0));

            this.rendererBehavior.repaint();
        }
    }

    /**
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     */
    checkDragScroll(mouse: Point) {
        const grid = this.grid;
        const scrollBehavior = this.scrollBehavior;
        if (
            grid.properties.scrollingEnabled &&
            grid.getDataBounds().containsPoint(mouse)
        ) {
            if (scrollBehavior.isScrollingNow()) {
                scrollBehavior.setScrollingNow(false);
            }
        } else {
            if (!scrollBehavior.isScrollingNow()) {
                scrollBehavior.setScrollingNow(true);
                this.scrollDrag();
            }
        }
    }

    /**
     * @desc this function makes sure that while we are dragging outside of the grid visible bounds, we srcroll accordingly
     */
    scrollDrag() {
        const grid = this.grid;
        const scrollBehavior = this.scrollBehavior;
        if (!scrollBehavior.isScrollingNow()) {
            return;
        }

        const b = grid.getDataBounds();
        let xOffset: number;

        if (this._currentDrag.x < b.origin.x) {
            xOffset = -1;
        } else {
            if (this._currentDrag.x > b.origin.x + b.extent.x) {
                xOffset = 1;
            } else {
                xOffset = 0;
            }
        }

        if (xOffset !== 0) {
            if (this._lastDragColumn >= grid.getFixedColumnCount()) {
                this._lastDragColumn += xOffset;
            }
            scrollBehavior.scrollColumnsBy(xOffset);
        }

        this.handleMouseDragCellSelection(this._lastDragColumn); // update the selection
        this.rendererBehavior.repaint();
        setTimeout(() => this.scrollDrag(), 25);
    }

    /**
     * @desc extend a selection or create one if there isnt yet
     */
    extendSelection(x: number, shiftKeyDown: boolean, ctrlKeyDown: boolean) {
        const grid = this.grid;
        if (grid.abortEditing()) {
            const mouseDown = this.userInterfaceInputBehavior.getMouseDown();
            if (mouseDown === undefined) {
                throw new AssertError('CSES77765');
            } else {
                const mouseX = mouseDown.x;

                if (x < 0) { // outside of the grid?
                    return; // do nothing
                }

                const selectionBehavior = this.focusSelectionBehavior;
                const userInterfaceInputBehavior = this.userInterfaceInputBehavior;
                if (shiftKeyDown) {
                    selectionBehavior.clearMostRecentColumnSelection();
                    selectionBehavior.focusSelectColumns(x, mouseX);
                    userInterfaceInputBehavior.setDragExtent(Point.create(x - mouseX, 0));
                } else {
                    selectionBehavior.toggleSelectColumn(x, shiftKeyDown, ctrlKeyDown);
                    userInterfaceInputBehavior.setMouseDown(Point.create(x, 0));
                    userInterfaceInputBehavior.setDragExtent(Point.create(0, 0));
                }

                this.rendererBehavior.repaint();
            }
        }
    }


    // eslint-disable-next-line @typescript-eslint/no-empty-function
    handleDOWNSHIFT() {

    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    handleUPSHIFT() {

    }

    handleLEFTSHIFT() {
        this.moveShiftSelect(-1);
    }

    handleRIGHTSHIFT() {
        this.moveShiftSelect(1);
    }

    handleDOWN() {

        // var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());
        // var maxRows = grid.getRowCount() - 1;

        // var newX = mouseCorner.x;
        // var newY = grid.getHeaderRowCount() + grid.getVScrollValue();

        // newY = Math.min(maxRows, newY);

        // grid.clearSelections();
        // grid.select(newX, newY, 0, 0);
        // grid.setMouseDown(new grid.rectangular.Point(newX, newY));
        // grid.setDragExtent(new grid.rectangular.Point(0, 0));

        // this.rendererBehavior.repaint();
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    handleUP() {

    }

    handleLEFT() {
        this.moveSingleSelect(-1, 0);
    }

    handleRIGHT() {
        this.moveSingleSelect(1, 0);
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
        this._sbAutoStart = Date.now();
    }

    /**
     * @desc update the autoscroll start time if we haven't autoscrolled within the last 500ms otherwise update the current autoscroll time
     */
    pingAutoScroll() {
        const now = Date.now();
        if (now - this._sbLastAuto > 500) {
            this.setAutoScrollStartTime();
        }
        this._sbLastAuto = Date.now();
    }

    /**
     * @desc answer how long we have been auto scrolling
     */
    getAutoScrollDuration() {
        if (Date.now() - this._sbLastAuto > 500) {
            return 0;
        }
        return Date.now() - this._sbAutoStart;
    }

    /**
     * @desc Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
     * @param offsetX - x coordinate to start at
     */
    moveShiftSelect(offsetX: number) {
        const grid = this.grid;
        const userInterfaceInputBehavior = this.userInterfaceInputBehavior;
        const origin = userInterfaceInputBehavior.getMouseDown();
        const extent = userInterfaceInputBehavior.getDragExtent();
        if (origin === undefined || extent === undefined) {
            throw new AssertError('CSMSS10087');
        } else {
            let newX = extent.x + offsetX;
            const maxViewableColumns = grid.renderer.visibleColumns.length - 1;
            let maxColumns = grid.getActiveColumnCount() - 1;

            if (!grid.properties.scrollingEnabled) {
                maxColumns = Math.min(maxColumns, maxViewableColumns);
            }

            newX = Math.min(maxColumns - origin.x, Math.max(-origin.x, newX));

            const selectionBehavior = this.focusSelectionBehavior;
            selectionBehavior.clearMostRecentColumnSelection();
            selectionBehavior.focusSelectColumns(origin.x, origin.x + newX);
            userInterfaceInputBehavior.setDragExtent(Point.create(newX, 0));

            if (grid.ensureModelColIsVisible(newX + origin.x, offsetX)) {
                this.pingAutoScroll();
            }

            this.rendererBehavior.repaint();
        }
    }

    /**
     * @desc Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
     * @param offsetY - x coordinate to start at
     */
    override moveSingleSelect(offsetX: number, offsetY: number) {
        const grid = this.grid;
        const extent = this.userInterfaceInputBehavior.getDragExtent();
        const mouseDown = this.userInterfaceInputBehavior.getMouseDown();
        if (mouseDown === undefined || extent === undefined) {
            throw new AssertError('CSMSS22209');
        } else {
            const mouseCorner = Point.plus(mouseDown, extent);
            let newX = mouseCorner.x + offsetY;
            let maxColumns = grid.getActiveColumnCount() - 1;
            const maxViewableColumns = grid.getVisibleColumnsCount() - 1;

            if (!grid.properties.scrollingEnabled) {
                maxColumns = Math.min(maxColumns, maxViewableColumns);
            }

            newX = Math.min(maxColumns, Math.max(0, newX));

            const selectionBehavior = this.focusSelectionBehavior;
            selectionBehavior.beginChange();
            try {
                selectionBehavior.clearSelection(true);
                selectionBehavior.focusSelectColumns(newX, newX);
            } finally {
                selectionBehavior.endChange();
            }
            this.userInterfaceInputBehavior.setMouseDown(Point.create(newX, 0));
            this.userInterfaceInputBehavior.setDragExtent(Point.create(0, 0));

            if (grid.ensureModelColIsVisible(newX, offsetY)) {
                this.pingAutoScroll();
            }

            this.rendererBehavior.repaint();
        }
    }

    isColumnDragging() {
        const dragger = this.grid.lookupFeature('ColumnMoving') as ColumnMoving;
        return dragger && (dragger.dragging || dragger.dragArmed); //&& !this.dragging;
    }

    private doubleClickDelay(event: CellEvent) {
        if (event.isHeaderCell) {
            const columnProperties = event.columnProperties;
            if (columnProperties.sortable && columnProperties.sortOnDoubleClick) {
                return 300;
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    }

    private doubleClickTimerCallback(event: MouseCellEvent) {
        this._doubleClickTimer = undefined;
        this._dragging = true;
        const mouseEvent = event.mouse.primitiveEvent;
        this.extendSelection(event.gridCell.x, mouseEvent.shiftKey, mouseEvent.ctrlKey);
    }
}

export namespace ColumnSelection {
    export const typeName = 'columnselection';
}
