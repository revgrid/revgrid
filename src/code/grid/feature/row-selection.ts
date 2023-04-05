
import { MouseCellEvent } from '../cell/cell-event';
import { EventDetail } from '../event/event-detail';
import { Feature } from '../feature/feature';
import { AssertError } from '../grid-public-api';
import { Point } from '../lib/point';
import { SelectionType } from '../selection/selection-type';

export class RowSelection extends Feature {

    readonly typeName = RowSelection.typeName;

    /**
     * The pixel location of the mouse pointer during a drag operation.
     */
    private _currentDrag: Point | undefined;

    /**
     * The row coordinates of the where the mouse pointer is during a drag operation.
     */
    private _lastDragRow = -3; // was null

    /**
     * a millisecond value representing the previous time an autoscroll started
     */
    private _sbLastAuto = 0;

    /**
     * a millisecond value representing the time the current autoscroll started
     */
    private _sbAutoStart = 0;

    private _dragArmed = false;
    private _dragging = false;

    /**
     * @param event - the event details
     */
    override handleMouseUp(event: MouseCellEvent) {
        if (this._dragArmed) {
            this._dragArmed = false;
            // this.moveCellSelection();
            this.grid.fireSyntheticRowSelectionChangedEvent();
        } else if (this._dragging) {
            this._dragging = false;
            // this.moveCellSelection();
            this.grid.fireSyntheticRowSelectionChangedEvent();
        } else if (this.next) {
            this.next.handleMouseUp(event);
        }
    }

    /**
     * @param event - the event details
     */
    override handleMouseDown(event: MouseCellEvent) {
        const detail = event.mouse;
        const leftClick = !detail.isRightClick;

        const grid = this.grid;
        const subgrid = event.subgrid;
        const rowSelectable = subgrid.selectable && this.gridProperties.rowSelection && (leftClick && grid.properties.autoSelectRows);

        /*if (rowSelectable && event.isHeaderHandle) {
            //global row selection
            grid.toggleSelectAllRows();
        } else */ if (rowSelectable && event.isMainRow)  {
            // if we are in the fixed area, do not apply the scroll values
            this._dragArmed = true;
            const mouseEvent = event.mouse.primitiveEvent;
            this.extendSelection(event.dataCell.y, mouseEvent.shiftKey);
        } else if (this.next) {
            this.next.handleMouseDown(event);
        }
    }

    override handleMouseDrag(event: MouseCellEvent) {
        const grid = this.grid;
        if (
            this._dragArmed &&
            grid.properties.rowSelection &&
            !event.mouse.isRightClick
        ) {
            //if we are in the fixed area do not apply the scroll values
            this._lastDragRow = event.dataCell.y;
            this._dragging = true;
            this._currentDrag = event.mouse.mouse;
            this.checkDragScroll(this._currentDrag);
            this.handleMouseDragCellSelection(this._lastDragRow);
        } else if (this.next) {
            this.next.handleMouseDrag(event);
        }
    }

    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        if (this.grid.getLastSelectionType() === SelectionType.Row) {
            const handler = this[('handle' + eventDetail.primitiveEvent.key) as keyof RowSelection] as ((this: void, detail: EventDetail.Keyboard) => void);
            if (handler !== undefined) {
                handler(eventDetail);
            } else {
                super.handleKeyDown(eventDetail);
            }
        } else {
            super.handleKeyDown(eventDetail);
        }
    }

    /**
     * @desc Handle a mousedrag selection
     */
    handleMouseDragCellSelection(y: number) {
        const selectionBehavior = this.selectionBehavior;
        const userInterfaceInputBehavior = this.userInterfaceInputBehavior;
        const mouseDown = userInterfaceInputBehavior.getMouseDown();
        if (mouseDown === undefined) {
            throw new AssertError('RSHMDCS88873');
        } else {
            const mouseY = mouseDown.y;

            selectionBehavior.clearMostRecentRowSelection();
            this.selection.selectRows(mouseY, y, undefined, undefined);
            userInterfaceInputBehavior.setDragExtent(Point.create(0, y - mouseY));

            this.rendererBehavior.repaint();
        }
    }

    /**
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     */
    private checkDragScroll(mousePoint: Point) {
        const grid = this.grid;
        const scrollBehavior = this.scrollBehavior;
        if (
            grid.properties.scrollingEnabled &&
            grid.getDataBounds().containsPoint(mousePoint)
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
    private scrollDrag() {
        const grid = this.grid;
        const scrollBehavior = this.scrollBehavior;
        if (!scrollBehavior.isScrollingNow()) {
            return;
        }

        const b = grid.getDataBounds();
        let yOffset: number | undefined;

        const currentDrag = this._currentDrag;
        if (currentDrag === undefined) {
            throw new AssertError('RSSD31009');
        } else {
            if (currentDrag.y < b.origin.y) {
                yOffset = -1;
            } else if (currentDrag.y > b.origin.y + b.extent.y) {
                yOffset = 1;
            }

            if (yOffset) {
                if (this._lastDragRow >= grid.getFixedRowCount()) {
                    this._lastDragRow += yOffset;
                }
                scrollBehavior.scrollVBy(yOffset);
            }

            this.handleMouseDragCellSelection(this._lastDragRow); // update the selection
            this.rendererBehavior.repaint();
            setTimeout(() => this.scrollDrag(), 25);
        }
    }

    /**
     * @desc extend a selection or create one if there isnt yet
     * @param keys - array of the keys that are currently pressed down
     */
    private extendSelection(y: number, shiftKeyDown: boolean) {
        const grid = this.grid;
        if (!grid.abortEditing()) { return; }

        const mouseDown = this.userInterfaceInputBehavior.getMouseDown();
        if (mouseDown === undefined) {
            throw new AssertError('RSES31109');
        } else {
            const mouseY = mouseDown.y;

            if (y < 0) { // outside of the grid?
                return; // do nothing
            }

            const selectionBehavior = this.selectionBehavior;
            const userInterfaceInputBehavior = this.userInterfaceInputBehavior;
            if (shiftKeyDown) {
                selectionBehavior.clearMostRecentRowSelection();
                selectionBehavior.selectRows(y, mouseY, undefined, undefined);
                userInterfaceInputBehavior.setDragExtent(Point.create(0, y - mouseY));
            } else {
                selectionBehavior.toggleSelectRow(y, shiftKeyDown, undefined);
                userInterfaceInputBehavior.setMouseDown(Point.create(0, y));
                userInterfaceInputBehavior.setDragExtent(Point.create(0, 0));
            }

            this.rendererBehavior.repaint();
        }
    }


    handleDOWNSHIFT() {
        this.moveShiftSelect(0, 1);
    }

    handleUPSHIFT() {
        this.moveShiftSelect(0, -1);
    }

    handleLEFTSHIFT() {
        this.moveShiftSelect(-1, 0);
    }

    handleRIGHTSHIFT() {
        this.moveShiftSelect(1, 0);
    }

    handleDOWN() {
        this.moveSingleSelect(0, 1);
    }

    handleUP() {
        this.moveSingleSelect(0, -1);
    }

    handleLEFT() {
        this.moveSingleSelect(0, 0);
    }

    handleRIGHT() {
        const grid = this.grid;
        const mouseDown = this.userInterfaceInputBehavior.getMouseDown();
        const extent = this.userInterfaceInputBehavior.getDragExtent();
        if (mouseDown === undefined || extent === undefined) {
            throw new AssertError('RSHR60334');
        } else {
            const mouseCorner = Point.plus(mouseDown, extent);
            const maxColumns = grid.getActiveColumnCount() - 1;
            let newX = grid.renderer.firstNonFixedColumnIndex;
            const newY = mouseCorner.y;

            newX = Math.min(maxColumns, newX);

            const selectionBehavior = this.selectionBehavior;
            selectionBehavior.beginChange();
            try {
                selectionBehavior.clearSelection(true);
                selectionBehavior.selectRectangle(newX, newY, 0, 0, undefined);
            } finally {
                selectionBehavior.endChange();
            }
            const userInterfaceInputBehavior = this.userInterfaceInputBehavior;
            userInterfaceInputBehavior.setMouseDown(Point.create(newX, newY));
            userInterfaceInputBehavior.setDragExtent(Point.create(0, 0));

            this.rendererBehavior.repaint();
        }
    }

    /**
     * @desc If we are holding down the same navigation key, accelerate the increment we scroll
     */
    getAutoScrollAcceleration() {
        let count = 1;
        const elapsed = this.getAutoScrollDuration() / 2000;
        count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
        return count;
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
     * @param offsetY - y coordinate to start at
     */
    moveShiftSelect(offsetX: number, offsetY: number) {
        this.moveSingleSelect(offsetX, offsetY, true);
    }

    /**
     * @desc Replace the most recent row selection with a single cell row selection `offsetY` rows from the previous selection.
     * @param offsetY - y coordinate to start at
     */
    override moveSingleSelect(offsetX: number, offsetY: number, shift?: boolean) {
        const grid = this.grid;
        const selectionBehavior = this.selectionBehavior;
        const selection = this.selection;
        const ranges = selection.rows.ranges;
        let lastRange = ranges[ranges.length - 1];
        let top = lastRange[0];
        let bottom = lastRange[1];

        let firstOffsetY: number | undefined;
        if (shift) {
            firstOffsetY = lastRange.offsetY = lastRange.offsetY || offsetY;
            if (lastRange.offsetY < 0) {
                top += offsetY;
            } else {
                bottom += offsetY;
            }
        } else {
            top += offsetY;
            bottom += offsetY;
        }

        if (top >= 0 && bottom < grid.getSubgridRowCount(selection.focusedSubgrid)) {
            ranges.length -= 1;
            if (ranges.length) {
                lastRange = ranges[ranges.length - 1];
                delete lastRange.offsetY;
            }
            selectionBehavior.selectRows(top, bottom, undefined, undefined);
            if (shift && top !== bottom) {
                lastRange = ranges[ranges.length - 1];
                lastRange.offsetY = firstOffsetY;
            }

            const userInterfaceInputBehavior = this.userInterfaceInputBehavior;
            userInterfaceInputBehavior.setMouseDown(Point.create(0, top));
            userInterfaceInputBehavior.setDragExtent(Point.create(0, bottom - top));

            this.scrollBehavior.scrollToMakeVisible(grid.properties.fixedColumnCount, offsetY < 0 ? top : bottom + 1, undefined); // +1 for partial row

            // this.moveCellSelection();
            grid.fireSyntheticRowSelectionChangedEvent();
            this.rendererBehavior.repaint();
        }
    }

    isSingleRowSelection() {
        return true;
    }

    // private moveCellSelection() {
    //     let rowIndices: number[];

    //     const grid = this.grid;
    //     if (
    //         grid.properties.collapseCellSelections &&
    //         grid.properties.singleRowSelectionMode && // let's only attempt this when in this mode
    //         !grid.properties.multipleSelections && // and only when in single selection mode
    //         (rowIndices = grid.getSelectedRowIndices()).length // user just selected a row (must be single row due to mode we're in)
    //     ) {
    //         const rect = grid.selection.getLastRectangle(); // the only cell selection
    //         if (rect !== undefined) {
    //             const x = rect.left;
    //             const y = rowIndices[0]; // we know there's only 1 row selected
    //             const width = rect.right - x;
    //             const height = 0; // collapse the new region to occupy a single row
    //             const fireSelectionChangedEvent = false;

    //             grid.selection.selectRectangle(x, y, width, height, undefined, fireSelectionChangedEvent);
    //             this.rendererBehavior.repaint();
    //         }
    //     }
    // }
}

export namespace RowSelection {
    export const typeName = 'rowselection';
}
