
import { MouseCellEvent } from '../cell/cell-event';
import { SubgridInterface } from '../common/subgrid-interface';
import { EventDetail } from '../event/event-detail';
import { Feature } from '../feature/feature';
import { GridProperties } from '../grid-properties';
import { Point } from '../lib/point';
import { AssertError } from '../lib/revgrid-error';
import { SelectionArea } from '../lib/selection-area';

export class CellSelection extends Feature {

    readonly typeName = CellSelection.typeName;

    /**
     * The pixel location of the mouse pointer during a drag operation.
     */
    private _currentDrag: Point;

    /**
     * the cell coordinates of the where the mouse pointer is during a drag operation
     */
    private _lastDragCell: Point;

    /**
     * a millisecond value representing the previous time an autoscroll started
     */
    private _sbLastAuto = 0;

    /**
     * a millisecond value representing the time the current autoscroll started
     */
    private _sbAutoStart = 0;
    private _dragging: boolean;

    override handleMouseUp(event: MouseCellEvent) {
        if (this._dragging) {
            this._dragging = false;
        }
        super.handleMouseUp(event);
    }

    override handleMouseDown(event: MouseCellEvent) {
        const dx = event.gridCell.x;
        const dy = event.dataCell.y;
        const subgrid = event.subgrid;
        const isSelectable = subgrid.selectable && this.cellPropertiesBehavior.getCellProperty(event.column, event.gridCell.y, 'cellSelection', subgrid);

        if (isSelectable && event.isDataColumn && !event.mouse.isRightClick) {
            const dCell = Point.create(dx, dy);
            const mouse = event.mouse;
            this._dragging = true;
            const focusSelectionBehavior = this.focusSelectionBehavior;
            const mouseEvent = mouse.primitiveEvent;
            let areaTypeSpecifier: SelectionArea.TypeSpecifier;
            if (GridProperties.isSecondarySelectionAreaTypeSpecifierModifierKeyDownInMouseEvent(this.gridProperties, mouseEvent)) {
                areaTypeSpecifier = SelectionArea.TypeSpecifier.Secondary;
            } else {
                areaTypeSpecifier = SelectionArea.TypeSpecifier.Primary;
            }
            const addToggleModifier = GridProperties.isAddToggleSelectionAreaModifierKeyDownInMouseEvent(this.gridProperties, mouseEvent);
            const extendModifier = GridProperties.isExtendLastSelectionAreaModifierKeyDownInMouseEvent(this.gridProperties, mouseEvent);
            if (extendModifier) {
                if (addToggleModifier) {
                    this.focusSelectOnlyCell(dx, dy, subgrid, areaTypeSpecifier);
                } else {
                    if (subgrid === this.focus.subgrid) {
                        focusSelectionBehavior.replaceLastAreaFromFocus(dx, dy, areaTypeSpecifier);
                    }
                }
            } else {
                if (addToggleModifier) {
                    if (this.gridProperties.addToggleSelectionAreaModifierKeyDoesToggle) {
                        focusSelectionBehavior.focusToggleSelectCell(dx, dy, subgrid, areaTypeSpecifier);
                    } else {
                        focusSelectionBehavior.focusSelectAddCell(dx, dy, subgrid, areaTypeSpecifier);
                    }
                } else {
                    this.focusSelectOnlyCell(dx, dy, subgrid, areaTypeSpecifier);
                }
            }

            this.extendSelection(dCell, mouse.primitiveEvent.shiftKey, mouse.primitiveEvent.ctrlKey);
        } else {
            super.handleMouseDown(event);
        }
    }

    override handleMouseDrag(event: MouseCellEvent) {
        const grid = this.grid;
        if (this._dragging && grid.properties.cellSelection && !event.mouse.isRightClick) {
            this._currentDrag = event.mouse.mouse;
            this._lastDragCell = Point.create(event.gridCell.x, event.dataCell.y);
            this.checkDragScroll(this._currentDrag);
            this.handleMouseDragCellSelection(this._lastDragCell);
        } else {
            super.handleMouseDrag(event);
        }
    }

    /**
     * @param eventDetail - the event details
     */
    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        const grid = this.grid;
        const navKey = grid.generateNavKey(eventDetail.primitiveEvent)
        const handler = this[('handle' + navKey) as keyof CellSelection] as ((keyboardEvent: KeyboardEvent) => void);

        // STEP 1: Move the selection
        if (handler) {
            handler.call(this, eventDetail.primitiveEvent);

            // STEP 2: Open the cell editor at the new position if `editable` AND edited cell had `editOnNextCell`
            let cellEvent = grid.getFocusedCellEvent(true);
            if (cellEvent !== undefined) {
                if (cellEvent.columnProperties.editOnNextCell) {
                    grid.renderer.computeCellsBounds(true); // moving selection may have auto-scrolled
                    cellEvent = grid.getFocusedCellEvent(false); // new cell
                    if (cellEvent !== undefined) {
                        grid.editAt(cellEvent); // succeeds only if `editable`
                    }
                }
            }

            // STEP 3: If editor not opened on new cell, take focus
            if (!grid.cellEditor) {
                grid.takeFocus();
            }
        } else {
            super.handleKeyDown(eventDetail);
        }
    }

    /**
     * @desc Handle a mousedrag selection.
     * @param keys - array of the keys that are currently pressed down
     */
    handleMouseDragCellSelection(gridCell: Point) {
        const x = Math.max(0, gridCell.x);
        const y = Math.max(0, gridCell.y);
        const userInterfaceInputBehavior = this.userInterfaceInputBehavior;
        const previousDragExtent = userInterfaceInputBehavior.getDragExtent();
        const mouseDown = userInterfaceInputBehavior.getMouseDown();
        if (mouseDown === undefined || previousDragExtent === undefined) {
            throw new AssertError('CSHMDCS32220');
        } else {
            const newX = x - mouseDown.x;
            const newY = y - mouseDown.y;

            if (previousDragExtent.x === newX && previousDragExtent.y === newY) {
                return;
            }

            const selectionBehavior = this.focusSelectionBehavior;
            selectionBehavior.beginChange();
            try {
                selectionBehavior.clearMostRecentRectangleSelection();
                selectionBehavior.selectRectangle(mouseDown.x, mouseDown.y, newX, newY, undefined);
            } finally {
                selectionBehavior.endChange();
            }
            userInterfaceInputBehavior.setDragExtent(Point.create(newX, newY));

            this.rendererBehavior.repaint();
        }
    }

    /**
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     */
    checkDragScroll(mouse: Point) {
        const grid = this.grid;
        const scrollBehavior = this.scrollBehavior;
        if (!this.gridProperties.scrollingEnabled) {
            return;
        }
        const b = grid.getDataBounds();
        const inside = b.containsPoint(mouse);
        if (inside) {
            if (scrollBehavior.isScrollingNow()) {
                scrollBehavior.setScrollingNow(false);
            }
        } else if (!scrollBehavior.isScrollingNow()) {
            scrollBehavior.setScrollingNow(true);
            this.scrollDrag();
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

        const dragStartedInHeaderArea = grid.isMouseDownInHeaderArea();
        const lastDragCell = this._lastDragCell;
        const b = grid.getDataBounds();

        let xOffset = 0;
        let yOffset = 0;

        const numFixedColumns = grid.getFixedColumnCount();
        const numFixedRows = grid.getFixedRowCount();

        const dragEndInFixedAreaX = lastDragCell.x < numFixedColumns;
        const dragEndInFixedAreaY = lastDragCell.y < numFixedRows;

        if (!dragStartedInHeaderArea) {
            if (this._currentDrag.x < b.origin.x) {
                xOffset = -1;
            }
            if (this._currentDrag.y < b.origin.y) {
                yOffset = -1;
            }
        }
        if (this._currentDrag.x > b.origin.x + b.extent.x) {
            xOffset = 1;
        }
        if (this._currentDrag.y > b.origin.y + b.extent.y) {
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

        this._lastDragCell = Point.plusXY(lastDragCell, dragCellOffsetX, dragCellOffsetY);
        scrollBehavior.scrollBy(xOffset, yOffset);
        this.handleMouseDragCellSelection(lastDragCell); // update the selection
        this.rendererBehavior.repaint();
        setTimeout(this.scrollDrag.bind(this, grid), 25);
    }

    /**
     * @desc extend a selection or create one if there isnt yet
     * @param {Array} keys - array of the keys that are currently pressed down
     */
    extendSelection(gridCell: Point, shiftKeyDown: boolean, ctrlKeyDown: boolean) {
        const grid = this.grid;
        const mousePoint = this.userInterfaceInputBehavior.getMouseDown();
        if (mousePoint === undefined) {
            throw new AssertError('CSES07721');
        } else {
            const x = gridCell.x; // - numFixedColumns + scrollLeft;
            const y = gridCell.y; // - numFixedRows + scrollTop;

            //were outside of the grid do nothing
            if (x < 0 || y < 0) {
                return;
            }

            const selectionBehavior = this.focusSelectionBehavior;
            selectionBehavior.beginChange();
            try {
                //we have repeated a click in the same spot deslect the value from last time
                const userInterfaceInputBehavior = this.userInterfaceInputBehavior;
                if (
                    ctrlKeyDown &&
                    x === mousePoint.x &&
                    y === mousePoint.y
                ) {
                    selectionBehavior.clearMostRecentRectangleSelection();
                    userInterfaceInputBehavior.popMouseDown();
                    this.rendererBehavior.repaint();
                    return;
                }

                if (!ctrlKeyDown && !shiftKeyDown) {
                    grid.clearSelection();
                }

                if (shiftKeyDown) {
                    selectionBehavior.clearMostRecentRectangleSelection();
                    selectionBehavior.selectRectangle(mousePoint.x, mousePoint.y, x - mousePoint.x, y - mousePoint.y, undefined);
                    userInterfaceInputBehavior.setDragExtent(Point.create(x - mousePoint.x, y - mousePoint.y));
                } else {
                    selectionBehavior.selectRectangle(x, y, 0, 0, undefined);
                    userInterfaceInputBehavior.setMouseDown(Point.create(x, y));
                    userInterfaceInputBehavior.setDragExtent(Point.create(0, 0));
                }
            } finally {
                selectionBehavior.endChange();
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

    handleDOWN(event: KeyboardEvent) {
        //keep the browser viewport from auto scrolling on key event
        event.preventDefault();

        const count = this.getAutoScrollAcceleration();
        this.focusSelectionBehavior.moveCellFocus(0, count, SelectionArea.TypeSpecifier.Primary);
    }

    handleUP(event: KeyboardEvent) {
        //keep the browser viewport from auto scrolling on key event
        event.preventDefault();

        const count = this.getAutoScrollAcceleration();
        this.focusSelectionBehavior.moveCellFocus(0, -count, SelectionArea.TypeSpecifier.Primary);
    }

    handleLEFT() {
        this.focusSelectionBehavior.moveCellFocus(-1, 0, SelectionArea.TypeSpecifier.Primary);
    }

    handleRIGHT() {
        this.focusSelectionBehavior.moveCellFocus(1, 0, SelectionArea.TypeSpecifier.Primary);
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
     * @param offsetY - y coordinate to start at
     */
    moveShiftSelect(offsetX: number, offsetY: number) {
        if (this.focusSelectionBehavior.extendLastArea(offsetX, offsetY)) {
            this.pingAutoScroll();
        }
    }

    private focusSelectOnlyCell(originX: number, originY: number, subgrid: SubgridInterface, areaTypeSpecifier: SelectionArea.TypeSpecifier) {
        const lastViewableColumnIndex = this.renderer.getVisibleColumnsCount() - 1;
        const lastViewableRowIndex = this.renderer.getVisibleRowsCount() - 1;

        let lastColumnIndex = this.columnsManager.getActiveColumnCount() - 1;
        let lastSubgridRowIndex = subgrid.getRowCount() - 1;

        if (!this.gridProperties.scrollingEnabled) {
            lastColumnIndex = Math.min(lastColumnIndex, lastViewableColumnIndex);
            lastSubgridRowIndex = Math.min(lastSubgridRowIndex, lastViewableRowIndex);
        }

        originX = Math.min(lastColumnIndex, Math.max(0, originX));
        originY = Math.min(lastSubgridRowIndex, Math.max(0, originY));

        this.focusSelectionBehavior.focusSelectOnlyCell(originX, originY, subgrid, areaTypeSpecifier);
    }
}

export namespace CellSelection {
    export const typeName = 'cellselection';

    export const enum MouseDownAction {
        Only,
        Extend,
        AddDelete,
    }
}
