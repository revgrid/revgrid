import { CellEvent, MouseCellEvent } from '../cell/cell-event';
import { ViewportCell } from '../cell/viewport-cell';
import { EventDetail } from '../event/event-detail';
import { Point } from '../lib/point';
import { AssertError } from '../lib/revgrid-error';
import { SelectionArea } from '../lib/selection-area';
import { StartLength } from '../lib/start-length';
import { ColumnMoving } from './column-moving-feature';
import { Feature } from './feature';

export class ColumnSelectionFeature extends Feature {

    readonly typeName = ColumnSelectionFeature.typeName;

    private _extendSelectOrigin: Point | undefined;
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

    private _dragArmed = false;
    private _doubleClickTimer: ReturnType<typeof setTimeout> | undefined;


    override handleMouseUp(event: MouseCellEvent) {
        if (this._dragArmed) {
            this._dragArmed = false;
        }
        super.handleMouseUp(event);
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
        if (this._doubleClickTimer === undefined) {
            // todo: >= 5 depends on header being top-most row which is currently always true but we may allow header "section" to be arbitrary position within quadrant (see also handleMouseDown in ColumnMoving.js)
            if (
                this.gridProperties.mouseColumnSelection &&
                !event.mouse.isRightClick &&
                (
                    this.gridProperties.autoSelectColumns ||
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
    }

    override handleMouseDrag(event: MouseCellEvent) {
        if (
            this.gridProperties.mouseColumnSelection &&
            !this.isColumnDragging() &&
            !event.mouse.isRightClick &&
            this._dragArmed
        ) {
            //if we are in the fixed area do not apply the scroll values
            this._lastDragColumn = event.gridCell.x;
            this.checkDragScroll(event.mouse.mouse);
            this.checkUpdateLastSelectionArea(event.gridCell);
        } else {
            super.handleMouseDrag(event);
        }
    }

    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        const lastSelectionArea = this.selection.lastArea;
        if (lastSelectionArea !== undefined) {
            const lastSelectionType = lastSelectionArea.areaType;
            if (lastSelectionType !== SelectionArea.Type.Column) {
                super.handleKeyDown(eventDetail);
            } else {
                const handler = this[('handle' + eventDetail.primitiveEvent.key) as keyof ColumnSelectionFeature] as (() => void);
                if (handler === undefined) {
                    super.handleKeyDown(eventDetail);
                } else {
                    handler.call(this);
                }
            }
        }
    }

    /**
     * @desc Handle a mousedrag selection
     * @param keys - array of the keys that are currently pressed down
     */
    checkUpdateLastSelectionArea(lastCellPoint: Point) {
        const extendSelectOrigin = this._extendSelectOrigin;
        if (extendSelectOrigin === undefined) {
            throw new AssertError('CSFHMDCS54455');
        } else {
            const xExclusiveStartLength = StartLength.createExclusiveFromFirstLast(lastCellPoint.x, extendSelectOrigin.x);
            const yExclusiveStartLength = StartLength.createExclusiveFromFirstLast(lastCellPoint.y, extendSelectOrigin.y);
            const focusSelectionBehavior = this.focusSelectionBehavior;
            focusSelectionBehavior.replaceLastAreaWithColumns(
                xExclusiveStartLength.start, yExclusiveStartLength.start,
                xExclusiveStartLength.length, yExclusiveStartLength.length,
            );
        }
    }

    /**
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     */
    checkDragScroll(mousePoint: Point) {
        const scrollBehavior = this.scrollBehavior;
        const scrollableBounds = this.viewport.scrollableBounds;
        if (this.gridProperties.scrollingEnabled && scrollableBounds !== undefined && scrollableBounds.containsPoint(mousePoint)) {
            if (scrollBehavior.isScrollingActive()) {
                scrollBehavior.setScrollingActive(false);
            }
        } else {
            if (!scrollBehavior.isScrollingActive()) {
                scrollBehavior.setScrollingActive(true);
                this.scrollDrag(mousePoint);
            }
        }
    }

    /**
     * @desc this function makes sure that while we are dragging outside of the grid visible bounds, we srcroll accordingly
     */
    scrollDrag(mousePoint: Point, viewportCell: ViewportCell | undefined) {
        const scrollBehavior = this.scrollBehavior;
        if (scrollBehavior.isScrollingActive()) {
            const viewport = this.viewport;
            const b = this.viewport.scrollableBounds;
            if (b !== undefined) {
                let wantedMaximallyVisibleActiveColumnIndex: number | undefined;

                if (mousePoint.x < b.topLeft.x) {
                    const firstScrollableColumnLeftOverflow = viewport.firstScrollableColumnLeftOverflow;
                    const oldColumnScrollAnchorIndex = viewport.columnScrollAnchorIndex;
                    if (firstScrollableColumnLeftOverflow !== undefined && firstScrollableColumnLeftOverflow > 0) {
                        wantedMaximallyVisibleActiveColumnIndex = oldColumnScrollAnchorIndex;
                    } else {
                        if (oldColumnScrollAnchorIndex > this.columnsManager.getFixedColumnCount()) {
                            wantedMaximallyVisibleActiveColumnIndex = oldColumnScrollAnchorIndex - 1;
                        }
                    }
                } else {
                    if (mousePoint.x > b.topLeft.x + b.extent.x) {
                        xOffset = 1;
                    }
                }

                if (wantedMaximallyVisibleActiveColumnIndex !== undefined) {
                    scrollBehavior.ensureColumnIsMaximallyVisible(wantedMaximallyVisibleActiveColumnIndex);
                    setTimeout(() => this.scrollDrag(mousePoint), 25);
                }

                if (viewportCell === undefined) {
                    gridCellPoint = this.viewport.calculateGridCellPointAt(mousePoint);
                }

                if (gridCellPoint !== undefined)

                this.checkUpdateLastSelectionArea(cellPoint, mousePoint.y); // update the selection
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    handleDOWNSHIFT() {
        this._extendSelectOrigin = undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    handleUPSHIFT() {
        this._extendSelectOrigin = undefined;
    }

    handleLEFTSHIFT() {
        this.moveShiftSelect();
    }

    handleRIGHTSHIFT() {
        this.moveShiftSelect();
    }

    handleDOWN() {
        this._extendSelectOrigin = undefined;
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
        this._extendSelectOrigin = undefined;
    }

    handleLEFT() {
        this._extendSelectOrigin = undefined;
    }

    handleRIGHT() {
        this._extendSelectOrigin = undefined;
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
    moveShiftSelect() {
        const focusPoint = this.focus.point;
        if (focusPoint === undefined) {
            throw new AssertError('CSFMSS34440');
        } else {
            if (this._extendSelectOrigin === undefined) {
                if (this.focus.previousPoint !== undefined) {
                    this._extendSelectOrigin = Point.copy(this.focus.previousPoint);
                } else {
                    this._extendSelectOrigin = Point.copy(focusPoint);
                }
            }

            let newX = focusPoint.x;

            const viewportColumns = this.viewport.columns;
            if (!this.gridProperties.scrollingEnabled) {
                const firstScrollableVisibleColumnIndex = this.viewport.firstScrollableColumnIndex;
                if (firstScrollableVisibleColumnIndex === undefined) {
                    return;
                } else {
                    const firstScrollableColumn = viewportColumns[firstScrollableVisibleColumnIndex];
                    const firstScrollableActiveColumnIndex = firstScrollableColumn.activeColumnIndex;
                    if (newX < firstScrollableActiveColumnIndex) {
                        newX = firstScrollableActiveColumnIndex;
                    }

                    const visibleColumnCount = viewportColumns.length;
                    const lastScrollableColumn = viewportColumns[visibleColumnCount - 1];
                    const lastScrollableActiveColumnIndex = lastScrollableColumn.activeColumnIndex;
                    if (newX > lastScrollableActiveColumnIndex) {
                        newX = lastScrollableActiveColumnIndex;
                    }
                }

                // should really limit y as well
            }

            const focusSelectionBehavior = this.focusSelectionBehavior;
            focusSelectionBehavior.replaceLastAreaWithColumns(this._extendSelectOrigin.x, this._extendSelectOrigin.y, newX, focusPoint.y);

            if (this.scrollBehavior.ensureColumnIsMaximallyVisible(newX)) {
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
        this._dragArmed = true;

        const mouseEvent = event.mouse.primitiveEvent;
        const mouseCell = event.gridCell;
        const focusSelectionBehavior = this.focusSelectionBehavior;
        if (mouseEvent.shiftKey) {
            const extendSelectOrigin = this._extendSelectOrigin;
            if (extendSelectOrigin !== undefined) {
                focusSelectionBehavior.replaceLastAreaWithColumns(extendSelectOrigin.x, extendSelectOrigin.y, mouseCell.x, mouseCell.y);
            } else {
                focusSelectionBehavior.focusSelectColumns(mouseCell.x, mouseCell.x, undefined, undefined);
                this._extendSelectOrigin = Point.copy(mouseCell);
            }
        } else {
            focusSelectionBehavior.focusSelectColumns(mouseCell.x, mouseCell.x, undefined, undefined);
            this._extendSelectOrigin = Point.copy(mouseCell);
        }

        this.rendererBehavior.repaint();
    }
}

export namespace ColumnSelectionFeature {
    export const typeName = 'columnselection';
}
