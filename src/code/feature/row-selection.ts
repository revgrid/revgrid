
import { Canvas } from '../canvas/canvas';
import { Hypegrid } from '../grid/hypegrid';
import { Point } from '../lib/point';
import { CellEvent } from '../renderer/cell-event';
import { Feature } from './feature';

export class RowSelection extends Feature {

    readonly typeName = RowSelection.typeName;

    /**
     * The pixel location of the mouse pointer during a drag operation.
     */
    currentDrag: Point | null = null;

    /**
     * The row coordinates of the where the mouse pointer is during a drag operation.
     */
    lastDragRow = -3; // was null

    /**
     * a millisecond value representing the previous time an autoscroll started
     */
    sbLastAuto = 0;

    /**
     * a millisecond value representing the time the current autoscroll started
     */
    sbAutoStart = 0;

    dragArmed = false;
    dragging = false;

    /**
     * @param event - the event details
     */
    override handleMouseUp(grid: Hypegrid, event: CellEvent) {
        if (this.dragArmed) {
            this.dragArmed = false;
            moveCellSelection(grid);
            grid.fireSyntheticRowSelectionChangedEvent();
        } else if (this.dragging) {
            this.dragging = false;
            moveCellSelection(grid);
            grid.fireSyntheticRowSelectionChangedEvent();
        } else if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    }

    /**
     * @param event - the event details
     */
    override handleMouseDown(grid: Hypegrid, event: CellEvent) {
        const detail = event.primitiveEvent.detail;
        const leftClick = !detail.isRightClick;

        const rowSelectable = grid.properties.rowSelection && (leftClick && grid.properties.autoSelectRows);

        /*if (rowSelectable && event.isHeaderHandle) {
            //global row selection
            grid.toggleSelectAllRows();
        } else */ if (rowSelectable && event.isDataRow)  {
            // if we are in the fixed area, do not apply the scroll values
            this.dragArmed = true;
            this.extendSelection(grid, event.dataCell.y, event.primitiveEvent.detail.keys);
        } else if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    }

    override handleMouseDrag(grid: Hypegrid, event: CellEvent) {
        if (
            this.dragArmed &&
            grid.properties.rowSelection &&
            !event.primitiveEvent.detail.isRightClick
        ) {
            //if we are in the fixed area do not apply the scroll values
            this.lastDragRow = event.dataCell.y;
            this.dragging = true;
            this.currentDrag = event.primitiveEvent.detail.mouse;
            this.checkDragScroll(grid, this.currentDrag);
            this.handleMouseDragCellSelection(grid, this.lastDragRow, event.primitiveEvent.detail.keys);
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    }

    override handleKeyDown(grid: Hypegrid, event: Canvas.KeyboardSyntheticEvent) {
        let handler: (this: void, grid: Hypegrid, detail: Canvas.SyntheticEventDetail.Keyboard) => void;
        if (
            grid.getLastSelectionType() === 'row' &&
            (handler = this['handle' + event.detail.char])
        ) {
            handler(grid, event.detail);
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    }

    /**
     * @desc Handle a mousedrag selection
     * @param keys - array of the keys that are currently pressed down
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleMouseDragCellSelection(grid: Hypegrid, y: number, keys: string[]) {
        const mouseY = grid.getMouseDown().y;

        grid.clearMostRecentRowSelection();

        grid.selectRow(mouseY, y);
        grid.setDragExtent(grid.newPoint(0, y - mouseY));

        grid.repaint();
    }

    /**
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     */
    checkDragScroll(grid: Hypegrid, mousePoint: Point) {
        if (
            grid.properties.scrollingEnabled &&
            grid.getDataBounds().contains(mousePoint)
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
    scrollDrag(grid: Hypegrid) {
        if (!grid.isScrollingNow()) {
            return;
        }

        const b = grid.getDataBounds();
        let yOffset: number | undefined;

        if (this.currentDrag.y < b.origin.y) {
            yOffset = -1;
        } else if (this.currentDrag.y > b.origin.y + b.extent.y) {
            yOffset = 1;
        }

        if (yOffset) {
            if (this.lastDragRow >= grid.getFixedRowCount()) {
                this.lastDragRow += yOffset;
            }
            grid.scrollBy(0, yOffset);
        }

        this.handleMouseDragCellSelection(grid, this.lastDragRow, []); // update the selection
        grid.repaint();
        setTimeout(this.scrollDrag.bind(this, grid), 25);
    }

    /**
     * @desc extend a selection or create one if there isnt yet
     * @param keys - array of the keys that are currently pressed down
     */
    extendSelection(grid: Hypegrid, y: number, keys: string[]) {
        if (!grid.abortEditing()) { return; }

        const mouseY = grid.getMouseDown().y;
        const hasSHIFT = keys.indexOf('SHIFT') !== -1;

        if (y < 0) { // outside of the grid?
            return; // do nothing
        }

        if (hasSHIFT) {
            grid.clearMostRecentRowSelection();
            grid.selectRow(y, mouseY);
            grid.setDragExtent(grid.newPoint(0, y - mouseY));
        } else {
            grid.toggleSelectRow(y, keys);
            grid.setMouseDown(grid.newPoint(0, y));
            grid.setDragExtent(grid.newPoint(0, 0));
        }

        grid.repaint();
    }


    handleDOWNSHIFT(grid: Hypegrid) {
        this.moveShiftSelect(grid, 1);
    }

    handleUPSHIFT(grid: Hypegrid) {
        this.moveShiftSelect(grid, -1);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    handleLEFTSHIFT(grid: Hypegrid) {

    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    handleRIGHTSHIFT(grid: Hypegrid) {

    }

    handleDOWN(grid: Hypegrid) {
        this.moveSingleSelect(grid, 1);
    }

    handleUP(grid: Hypegrid) {
        this.moveSingleSelect(grid, -1);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    handleLEFT(grid: Hypegrid) {

    }

    handleRIGHT(grid: Hypegrid) {
        const mouseCorner = Point.plus(grid.getMouseDown(), grid.getDragExtent());
        const maxColumns = grid.getColumnCount() - 1;
        let newX = grid.getHScrollViewportStartColumnIndex();
        const newY = mouseCorner.y;

        newX = Math.min(maxColumns, newX);

        grid.clearSelections();
        grid.select(newX, newY, 0, 0);
        grid.setMouseDown(grid.newPoint(newX, newY));
        grid.setDragExtent(grid.newPoint(0, 0));

        grid.repaint();
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
     * @param offsetY - y coordinate to start at
     */
    moveShiftSelect(grid: Hypegrid, offsetY: number) {
        this.moveSingleSelect(grid, offsetY, true);
    }

    /**
     * @desc Replace the most recent row selection with a single cell row selection `offsetY` rows from the previous selection.
     * @param offsetY - y coordinate to start at
     */
    override moveSingleSelect(grid: Hypegrid, offsetY: number, shift?: boolean) {
        const selections = grid.selectionModel.rowSelectionModel.selection;
        let lastSelection = selections[selections.length - 1];
        let top = lastSelection[0];
        let bottom = lastSelection[1];

        let firstOffsetY: number;
        if (shift) {
            firstOffsetY = lastSelection.offsetY = lastSelection.offsetY || offsetY;
            if (lastSelection.offsetY < 0) {
                top += offsetY;
            } else {
                bottom += offsetY;
            }
        } else {
            top += offsetY;
            bottom += offsetY;
        }

        if (top < 0 || bottom >= grid.getRowCount()) {
            return;
        }

        selections.length -= 1;
        if (selections.length) {
            lastSelection = selections[selections.length - 1];
            delete lastSelection.offsetY;
        }
        grid.selectRow(top, bottom);
        if (shift && top !== bottom) {
            lastSelection = selections[selections.length - 1];
            lastSelection.offsetY = firstOffsetY;
        }

        grid.setMouseDown(grid.newPoint(0, top));
        grid.setDragExtent(grid.newPoint(0, bottom - top));

        grid.scrollToMakeVisible(grid.properties.fixedColumnCount, offsetY < 0 ? top : bottom + 1); // +1 for partial row

        moveCellSelection(grid);
        grid.fireSyntheticRowSelectionChangedEvent();
        grid.repaint();
    }

    isSingleRowSelection() {
        return true;
    }

}

function moveCellSelection(grid: Hypegrid) {
    let rows: number[];

    if (
        grid.properties.collapseCellSelections &&
        grid.properties.singleRowSelectionMode && // let's only attempt this when in this mode
        !grid.properties.multipleSelections && // and only when in single selection mode
        (rows = grid.getSelectedRows()).length && // user just selected a row (must be single row due to mode we're in)
        grid.selectionModel.getSelections().length  // there was a cell region selected (must be the only one)
    ) {
        const rect = grid.selectionModel.getLastSelection(); // the only cell selection
        const x = rect.left;
        const y = rows[0]; // we know there's only 1 row selected
        const width = rect.right - x;
        const height = 0; // collapse the new region to occupy a single row
        const fireSelectionChangedEvent = false;

        grid.selectionModel.select(x, y, width, height, fireSelectionChangedEvent);
        grid.repaint();
    }
}

export namespace RowSelection {
    export const typeName = 'rowselection';
}
