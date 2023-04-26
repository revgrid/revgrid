import { CanvasEx } from '../canvas/canvas-ex';
import { ColumnsManager } from '../column/columns-manager';
import { SubgridInterface } from '../common/subgrid-interface';
import { FinBar } from '../finbar/finbar';
import { GridProperties } from '../grid-properties';
import { Viewport } from '../renderer/viewport';
import { Subgrid } from '../subgrid/subgrid';
import { SubgridsManager } from '../subgrid/subgrids-manager';

export class ScrollBehavior {
    private _rowScrollAnchorIndex = 0;
    private _sbPrevVScrollValue: number | undefined;
    private _scrollingActive = false;
    private _resizeScrollbarsTimeoutHandle: ReturnType<typeof setTimeout> | undefined;

    constructor(
        private readonly _gridProperties: GridProperties,
        private readonly _canvasEx: CanvasEx,
        private readonly _columnsManager: ColumnsManager,
        private readonly _subgridsManager: SubgridsManager,
        private readonly _viewport: Viewport,
        readonly horizontalScroller: FinBar,
        readonly verticalScroller: FinBar,
        private readonly _behaviorChangedEventer: ScrollBehavior.BehaviourChangedEventer,
        private readonly _scrollEventer: ScrollBehavior.ScrollEventer,
        private readonly _getRowHeightEventer: ScrollBehavior.GetRowHeightEventer,
    ) {
        this.horizontalScroller.onchange = (x) => this.handleHScrollerChange(x);
        this.verticalScroller.onchange = (y) => this.handleVScrollerChange(y);
        this.verticalScroller.paging = {
            up: () => this.pageUp(),
            down: () => this.pageDown()
        }

    }

    /**
     * The index of the row at the top of the view in the main sub grid.
     */
    get rowScrollAnchorIndex() { return this._rowScrollAnchorIndex; }
    set rowScrollAnchorIndex(value: number) {
        this.handleVScrollerChange(value);
    }

    get horizontalViewportSize() { return this.horizontalScroller.viewportSize; }
    get horizontalContentStart() { return this.horizontalScroller.contentStart; }
    get horizontalContentFinish() { return this.horizontalScroller.contentFinish; }

    destroy() {
        this.checkClearResizeScrollbarsTimeout();
    }

    reset() {
        this._scrollingActive = false;
        this._sbPrevVScrollValue = undefined;
        this._rowScrollAnchorIndex = 0;
        this.checkClearResizeScrollbarsTimeout();
    }

    /** @internal */
    setScrollingActive(value: boolean) {
        this._scrollingActive = value;
    }

    /**
     * @returns The `scrollingNow` field.
     */
    isScrollingActive() {
        return this._scrollingActive;
    }

    /**
     * @summary Scroll horizontal and vertically by the provided offsets.
     * @param offsetColumnCount - Scroll in the x direction this many columns.
     * @param offsetY - Scroll in the y direction this many rows.
     */
    scrollBy(offsetColumnCount: number, offsetY: number) {
        this.scrollColumnsBy(offsetColumnCount);
        this.scrollVBy(offsetY);
    }

    /**
     * @summary Scroll vertically by the provided offset.
     * @param offsetY - Scroll in the y direction this much.
     */
    scrollVBy(offsetY: number) {
        const max = this.verticalScroller.contentRange.finish;
        const oldValue = this._rowScrollAnchorIndex;
        const newValue = Math.min(max, Math.max(0, oldValue + offsetY));
        if (newValue !== oldValue) {
            this.handleVScrollerChange(newValue);
        }
    }

    scrollVerticalIndex(delta: number) {
        this.verticalScroller.scrollIndex(delta);
    }

    /**
     * @summary Scroll horizontally by the provided offset.
     * @param offset - Scroll in the x direction this much.
     * @returns true if scrolled
     */
    scrollColumnsBy(offset: number) {
        if (this._viewport.scrollColumnScrollAnchor(offset, this._gridProperties.gridRightAligned)) {
            this._viewport.computeCellsBounds();
            const viewportStart = this.calculateColumnScrollAnchorViewportStart();
            this.horizontalScroller.setViewportStart(viewportStart);
            return true;
        } else {
            return false;
        }
    }

    scrollViewHorizontallyBy(delta: number) {
        if (this._viewport.horizontalScrollableContentOverflowed) {
            this.horizontalScroller.scroll(delta);
        }
    }

    scrollHorizontal(delta: number) {
        this.horizontalScroller.scroll(delta);
    }

    scrollToMakeVisible(activeColumnIndex: number, r: number, subgrid: SubgridInterface | undefined, maximally: boolean) {
        let computeCellsBoundsRequired = this.updateColumnScrollAnchorsToMakeColumnVisible(activeColumnIndex, maximally);

        if (subgrid === undefined || subgrid === this._subgridsManager.mainSubgrid) {

            const scrollableRowRange = this._viewport.scrollableRowRange;
            const fixedRowCount = this._gridProperties.fixedRowCount;
            let delta: number;

            if (
                scrollableRowRange !== undefined &&
                r >= fixedRowCount && // scroll only if target not in fixed rows
                (
                    // target is above scrollable rows; negative delta scrolls up
                    (delta = r - scrollableRowRange.start - 1) < 0 ||

                    // target is below scrollable rows; positive delta scrolls down
                    (delta = r - scrollableRowRange.after) > 0
                )
            ) {
                this.verticalScroller.scrollIndex(delta);
                computeCellsBoundsRequired = true; // Do this until fix up vertical scrolling
            }

        }

        if (computeCellsBoundsRequired) {
            this.processComputeCellsBoundsRequired()
        }
    }

    stepScroll(directionCanvasOffsetX: number, directionCanvasOffsetY: number) {
        let stepped = this.stepScrollColumn(directionCanvasOffsetX);
        if (this.stepScrollRow(directionCanvasOffsetY)) {
            stepped = true;
        }
        return stepped;
    }

    stepScrollColumn(directionCanvasOffsetX: number) {
        const viewport = this._viewport;
        const scrollableBounds = viewport.scrollableBounds;
        if (scrollableBounds === undefined) {
            return false;
        } else {
            let wantedMaximallyVisibleActiveColumnIndex: number | undefined;

            if (directionCanvasOffsetX < scrollableBounds.topLeft.x) {
                const firstVisibleScrollableColumnLeftOverflow = viewport.firstScrollableColumnLeftOverflow;
                const firstVisibleScrollableActiveColumnIndex = viewport.firstScrollableActiveColumnIndex;
                if (firstVisibleScrollableColumnLeftOverflow !== undefined && firstVisibleScrollableActiveColumnIndex !== undefined) {
                    if (firstVisibleScrollableColumnLeftOverflow > 0) {
                        wantedMaximallyVisibleActiveColumnIndex = firstVisibleScrollableActiveColumnIndex;
                    } else {
                        if (firstVisibleScrollableActiveColumnIndex > this._columnsManager.getFixedColumnCount()) {
                            wantedMaximallyVisibleActiveColumnIndex = firstVisibleScrollableActiveColumnIndex - 1;
                        }
                    }
                }
            } else {
                if (directionCanvasOffsetX > scrollableBounds.topLeft.x + scrollableBounds.extent.x) {
                    const lastVisibleScrollableColumnLeftOverflow = viewport.lastScrollableColumnRightOverflow;
                    const lastVisibleScrollableActiveColumnIndex = viewport.lastScrollableActiveColumnIndex;
                    if (lastVisibleScrollableColumnLeftOverflow !== undefined && lastVisibleScrollableActiveColumnIndex !== undefined) {
                        if (lastVisibleScrollableColumnLeftOverflow > 0) {
                            wantedMaximallyVisibleActiveColumnIndex = lastVisibleScrollableActiveColumnIndex;
                        } else {
                            const lastScrollableActiveColumnIndex = this._columnsManager.getActiveColumnCount() - 1;
                            if (lastVisibleScrollableActiveColumnIndex < lastScrollableActiveColumnIndex) {
                                wantedMaximallyVisibleActiveColumnIndex = lastVisibleScrollableActiveColumnIndex + 1;
                            }
                        }
                    }
                }
            }

            if (wantedMaximallyVisibleActiveColumnIndex === undefined) {
                return false;
            } else {
                this.ensureColumnIsMaximallyVisible(wantedMaximallyVisibleActiveColumnIndex);
                return true;
            }
        }
    }

    stepScrollRow(directionCanvasOffsetY: number) {
        const viewport = this._viewport;
        const scrollableBounds = viewport.scrollableBounds;

        if (scrollableBounds === undefined) {
            return false;
        } else {
            if (directionCanvasOffsetY < scrollableBounds.topLeft.y) {
                const headerPlusFixedRowCount = this._subgridsManager.calculateHeaderPlusFixedRowCount();
                const firstVisibleScrollableRowIndex = viewport.firstScrollableRowIndex;
                if (firstVisibleScrollableRowIndex !== undefined && firstVisibleScrollableRowIndex > headerPlusFixedRowCount) {
                    this.scrollVBy(-1);
                    return true;
                } else {
                    return false;
                }
            } else {
                if (directionCanvasOffsetY >= scrollableBounds.exclusiveBottom) {
                    const subgridsManager = this._subgridsManager;
                    const headerRowCount = subgridsManager.calculateHeaderRowCount();
                    const lastScrollableRowIndex = headerRowCount + subgridsManager.mainSubgrid.getRowCount() - 1;
                    const lastVisibleScrollableRowIndex = viewport.lastScrollableRowIndex;
                    if (lastVisibleScrollableRowIndex !== undefined && lastVisibleScrollableRowIndex < lastScrollableRowIndex) {
                        this.scrollVBy(+1);
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }
    }

    ensureColumnIsMaximallyVisible(activeColumnIndex: number) {
        const computeCellsBoundsRequired = this.updateColumnScrollAnchorsToMakeColumnVisible(activeColumnIndex, true);
        if (computeCellsBoundsRequired) {
            this.processComputeCellsBoundsRequired();
        }

        return computeCellsBoundsRequired; // scroll was required
    }

    ensureRowIsMaximallyVisible(rowIndex: number) {
        const firstScrollableRowIndex = this._viewport.firstScrollableRowIndex;
        if (firstScrollableRowIndex === undefined) {
            return false;
        } else {
            if (rowIndex < firstScrollableRowIndex) {
                this.scrollVBy(rowIndex - firstScrollableRowIndex);
                return true;
            } else {
                const lastScrollableRowIndex = this._viewport.lastScrollableRowIndex;
                if (lastScrollableRowIndex === undefined) {
                    return false;
                } else {
                    if (rowIndex > lastScrollableRowIndex) {
                        this.scrollVBy(rowIndex - lastScrollableRowIndex);
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        }
    }

    private updateColumnScrollAnchorsToMakeColumnVisible(c: number, maximally: boolean) {
        const gridRightAligned = this._gridProperties.gridRightAligned
        const scrollableColumnRange = this._viewport.scrollableColumnRange;
        const fixedColumnCount = this._gridProperties.fixedColumnCount;
        let anchorUpdated = false;

        // scroll only if target not in fixed columns unless grid right aligned
        if (scrollableColumnRange !== undefined && (c >= fixedColumnCount || gridRightAligned)) {
            const leftDelta =  c - scrollableColumnRange.start;
            const columnIsToLeft =
                leftDelta < 0 ||
                (maximally && leftDelta === 0 && !this._viewport.firstScrollableVisibleColumnMaximallyVisible);

            if (columnIsToLeft) {
                // target is to left of scrollable columns
                if (gridRightAligned) {
                    const {index, offset} = this._viewport.calculateColumnScrollAnchorToScrollIntoView(c, gridRightAligned, this.horizontalScroller.viewportSize);
                    anchorUpdated = this._viewport.setColumnScrollAnchor(index, offset);
                } else {
                    anchorUpdated = this._viewport.setColumnScrollAnchor(c);
                }
            } else {
                const rightDelta = c - scrollableColumnRange.after;
                const columnIsToRight =
                    rightDelta > 0 ||
                    (maximally && rightDelta === 0 && !this._viewport.lastScrollableVisibleColumnMaximallyVisible);

                if (columnIsToRight) {
                    // target is to right of scrollable columns
                    if (gridRightAligned) {
                        anchorUpdated = this._viewport.setColumnScrollAnchor(c);
                    } else {
                        const {index, offset} = this._viewport.calculateColumnScrollAnchorToScrollIntoView(c, gridRightAligned, this.horizontalScroller.viewportSize);
                        anchorUpdated = this._viewport.setColumnScrollAnchor(index, offset);
                    }
                }
            }
        }

        return anchorUpdated;
    }

    private processComputeCellsBoundsRequired() {
        this._viewport.computeCellsBounds();
        const viewportStart = this.calculateColumnScrollAnchorViewportStart();
        this.horizontalScroller.setViewportStart(viewportStart);
    }

    /**
     * @desc Set the vertical scroll value.
     * @param newValue - The new scroll value.
     * @internal
     */
    public handleVScrollerChange(y: number) {
        y = Math.min(this.verticalScroller.contentRange.finish, Math.max(0, Math.round(y)));
        if (y !== this._rowScrollAnchorIndex) {
            this._behaviorChangedEventer();
            // const oldY = this.vScrollValue;
            this._rowScrollAnchorIndex = y; // may need to be before this.behaviorChanged()
            this.scrollValueChangedNotification(false);
            setTimeout(() => {
                this._scrollEventer(false, y, -1, -1);
            }, 0);
        }
    }

    /**
     * @desc Set the horizontal scroll value.
     * @param x - The new scroll value.
     * @internal
     */
    public handleHScrollerChange(x: number) {
        const updated = this._viewport.updateColumnScrollAnchor(
            this.horizontalScroller.viewportStart,
            this.horizontalScroller.viewportFinish,
            this.horizontalScroller.contentStart,
            this.horizontalScroller.contentFinish
        );
        if (updated) {
            this._behaviorChangedEventer();
            this.scrollValueChangedNotification(true);
            setTimeout(() => {
                this._scrollEventer(true, x, this._viewport.columnScrollAnchorIndex, this._viewport.columnScrollAnchorOffset);
            }, 0);
        }
    }

    setHorizontalScrollerViewportStart(start: number) {
        this.horizontalScroller.setViewportStart(start);
    }

    /** @internal */
    private resizeScrollbars() {
        this.horizontalScroller.shortenBy(this.verticalScroller).resize();
        //this.sbVScroller.shortenBy(this.sbHScroller);
        this.verticalScroller.resize();
    }

    /**
     * @desc Scroll values have changed, we've been notified.
     * @internal
     */
    private setVScrollbarContentRange(finish: number) {
        this.verticalScroller.contentRange = {
            start: 0,
            finish: finish
        };
    }

    // HScroller only calls when change has occurred so it sets force true
    // Eventually VScroller should also only call when changed
    /** @internal */
    private scrollValueChangedNotification(force: boolean) {
        if (
            force ||
            this._rowScrollAnchorIndex !== this._sbPrevVScrollValue
        ) {
            this._sbPrevVScrollValue = this._rowScrollAnchorIndex;

            // if (this.cellEditor) {
            //     this.cellEditor.scrollValueChangedNotification();
            // }

            this._viewport.computeCellsBounds();
        }
    }

    /**
     * @desc The data dimensions have changed, or our pixel boundaries have changed.
     * Adjust the scrollbar properties as necessary.
     * @internal
     */
    public synchronizeScrollingBoundaries() {
        this.updateHorizontalScroll(false);
        this.updateVerticalScroll(false);

        this._viewport.computeCellsBounds();
        const viewportStart = this.calculateColumnScrollAnchorViewportStart();
        this.horizontalScroller.setViewportStart(viewportStart);

        // schedule to happen *after* the repaint
        if (this._resizeScrollbarsTimeoutHandle === undefined) {
            this._resizeScrollbarsTimeoutHandle = setTimeout(() => {
                this._resizeScrollbarsTimeoutHandle = undefined;
                this.resizeScrollbars()
            }, 0);
        }
    }

    private checkClearResizeScrollbarsTimeout() {
        if (this._resizeScrollbarsTimeoutHandle !== undefined) {
            clearTimeout(this._resizeScrollbarsTimeoutHandle);
            this._resizeScrollbarsTimeoutHandle = undefined;
        }
    }

    public updateHorizontalScroll(recalculateView: boolean) {
        const canvasBounds = this._canvasEx.getBounds();

        const gridProps = this._gridProperties;
        const gridRightAligned = gridProps.gridRightAligned;
        const columnCount = this._columnsManager.getActiveColumnCount();
        const fixedColumnCount = this._gridProperties.fixedColumnCount;

        let scrollerContentStart: number;
        if (fixedColumnCount === 0) {
            scrollerContentStart = 0;
        } else {
            const fixedColumnsWidth = this._columnsManager.calculateFixedColumnsWidth();
            const fixedLinesVWidth = gridProps.fixedLinesVWidth ?? gridProps.gridLinesVWidth;
            scrollerContentStart = fixedColumnsWidth + fixedLinesVWidth;
        }
        const scrollableColumnsViewportSize = canvasBounds.width - scrollerContentStart;

        let scrollerContentFinish: number;
        if (scrollableColumnsViewportSize <= 0) {
            const anchorLimits = this.calculateColumnScrollInactiveAnchorLimits(gridRightAligned, columnCount, fixedColumnCount);
            this._viewport.setColumnScrollAnchorLimits(false, anchorLimits);

            scrollerContentFinish = scrollerContentStart - 1;
            this.horizontalScroller.contentRange = {
                start: scrollerContentStart,
                finish: scrollerContentFinish // hMax
            };
            this.horizontalScroller.viewportSize = -1;
        } else {
            const contentSizeAndAnchorLimits = this.calculateColumnScrollContentSizeAndAnchorLimits(
                scrollerContentStart,
                scrollableColumnsViewportSize,
                gridRightAligned,
                columnCount,
                fixedColumnCount,
            );
            const { contentSize, contentOverflowed, anchorLimits } = contentSizeAndAnchorLimits;
            this._viewport.setColumnScrollAnchorLimits(contentOverflowed, anchorLimits);

            scrollerContentFinish = scrollerContentStart + contentSize - 1;
            this.horizontalScroller.contentRange = {
                start: scrollerContentStart,
                finish: scrollerContentFinish // hMax
            };
            this.horizontalScroller.viewportSize = scrollableColumnsViewportSize;

            if (this.horizontalScroller.hidden) {
                this._viewport.setColumnScrollAnchorToLimit(gridRightAligned)
            }

        }

        if (recalculateView) {
            this._viewport.computeCellsBounds();
            const viewportStart = this.calculateColumnScrollAnchorViewportStart();
            this.horizontalScroller.setViewportStart(viewportStart);
        }
    }

    private updateVerticalScroll(recalculateView: boolean) {
        const mainSubgrid = this._subgridsManager.mainSubgrid;
        const numRows = mainSubgrid.getRowCount();
        const gridProps = this._gridProperties;
        const scrollableHeight = this._viewport.getVisibleScrollHeight();
        const lineGap = gridProps.gridLinesHWidth;
        let rowsHeight = 0;
        let lastPageRowCount = 0;

        while (lastPageRowCount < numRows && rowsHeight < scrollableHeight) {
            rowsHeight += this._getRowHeightEventer(numRows - lastPageRowCount - 1, mainSubgrid) + lineGap;
            lastPageRowCount++;
        }
        if (rowsHeight > scrollableHeight) {
            lastPageRowCount--;
        }

        const vMax = Math.max(0, numRows - gridProps.fixedRowCount - lastPageRowCount);
        this.setVScrollbarContentRange(vMax);
        this.handleVScrollerChange(Math.min(this._rowScrollAnchorIndex, vMax));

        if (recalculateView) {
            this._viewport.computeCellsBounds();
        }
    }

    /**
     * @desc Scroll up one full page.
     */
    pageUp() {
        const rowNum = this._viewport.getPageUpRow();
        if (rowNum === undefined) {
            return undefined;
        } else {
            this.handleVScrollerChange(rowNum);
            return rowNum;
        }
    }

    /**
     * @desc Scroll down one full page.
     */
    pageDown() {
        const rowNum = this._viewport.getPageDownRow();
        if (rowNum === undefined) {
            return undefined;
        } else {
            this.handleVScrollerChange(rowNum);
            return rowNum;
        }
    }

    /**
     * @desc Not yet implemented.
     */
    pageLeft() {
        throw 'page left not yet implemented';
    }

    /**
     * @desc Not yet implemented.
     */
    pageRight() {
        throw 'page right not yet implemented';
    }

    private calculateColumnScrollAnchorViewportStart(): number {
        const gridRightAligned = this._gridProperties.gridRightAligned;
        if (gridRightAligned) {
            const finish = this._viewport.calculateColumnScrollAnchorViewportFinish(this.horizontalScroller.contentFinish);
            return finish - this.horizontalScroller.viewportSize + 1;
        } else {
            return this._viewport.calculateColumnScrollAnchorViewportStart(this.horizontalScroller.contentStart);
        }
    }

    private calculateColumnScrollInactiveAnchorLimits(
        gridRightAligned: boolean,
        columnCount: number,
        fixedColumnCount: number
    ): Viewport.ScrollAnchorLimits {
        let startAnchorLimitIndex: number;
        let finishAnchorLimitIndex: number;
        if (gridRightAligned) {
            finishAnchorLimitIndex = columnCount - 1;
            startAnchorLimitIndex = finishAnchorLimitIndex;
        } else {
            startAnchorLimitIndex = fixedColumnCount;
            finishAnchorLimitIndex = startAnchorLimitIndex;
        }
        return {
            startAnchorLimitIndex,
            startAnchorLimitOffset: 0,
            finishAnchorLimitIndex,
            finishAnchorLimitOffset: 0,
        };
    }

    private calculateColumnScrollContentSizeAndAnchorLimits(
        contentStart: number, // Fixed columns width + fixed gridline width
        viewportSize: number,
        gridRightAligned: boolean,
        columnCount: number,
        fixedColumnCount: number,
    ): Viewport.ScrollContentSizeAndAnchorLimits {
        let contentSize = this.calculateActiveNonFixedColumnsWidth();
        let anchorLimits: Viewport.ScrollAnchorLimits;

        const contentOverflowed = contentSize > viewportSize && columnCount > fixedColumnCount
        if (contentOverflowed) {
            let leftAnchorLimitIndex: number;
            let leftAnchorLimitOffset: number;
            let rightAnchorLimitIndex: number;
            let rightAnchorLimitOffset: number;

            const gridLinesVWidth = this._gridProperties.gridLinesVWidth;
            if (gridRightAligned) {
                rightAnchorLimitIndex = columnCount - 1;
                rightAnchorLimitOffset = 0;
                let prevColumnGridLineFinish = contentStart - 1;
                const lowestViewportFinish = prevColumnGridLineFinish + viewportSize;
                let lowestViewportStartColumnIndex = fixedColumnCount;
                let lowestViewportStartColumnFinish = prevColumnGridLineFinish + this._columnsManager.getActiveColumnWidth(lowestViewportStartColumnIndex);
                while (lowestViewportStartColumnFinish <= lowestViewportFinish) {
                    prevColumnGridLineFinish = lowestViewportStartColumnFinish;
                    lowestViewportStartColumnIndex++;
                    lowestViewportStartColumnFinish = prevColumnGridLineFinish + (this._columnsManager.getActiveColumnWidth(lowestViewportStartColumnIndex) + gridLinesVWidth);
                }
                leftAnchorLimitIndex = lowestViewportStartColumnIndex;
                leftAnchorLimitOffset = lowestViewportStartColumnFinish - lowestViewportFinish;
                if (!this._gridProperties.scrollHorizontallySmoothly) {
                    // Since we cannot show a partial column on right, this may prevent leftmost columns from being displayed in viewport
                    // Extend scrollable size (content size) so that the previous column can be shown on end when viewport is at start of content.
                    contentSize += (lowestViewportFinish - prevColumnGridLineFinish);
                    if (leftAnchorLimitOffset !== 0) {
                        leftAnchorLimitOffset = 0;
                        if (leftAnchorLimitIndex > fixedColumnCount) {
                            leftAnchorLimitIndex--;
                        }
                    }
                }
            } else {
                leftAnchorLimitIndex = fixedColumnCount;
                leftAnchorLimitOffset = 0;
                const highestViewportStart = contentSize - viewportSize;
                let nextColumnLeft = contentSize;
                let highestViewportStartColumnIndex = columnCount - 1;
                let highestViewportStartColumnLeft = nextColumnLeft - this._columnsManager.getActiveColumnWidth(highestViewportStartColumnIndex);
                while (highestViewportStartColumnLeft > highestViewportStart) {
                    nextColumnLeft = highestViewportStartColumnLeft;
                    highestViewportStartColumnIndex--;
                    highestViewportStartColumnLeft = nextColumnLeft - (this._columnsManager.getActiveColumnWidth(highestViewportStartColumnIndex) + gridLinesVWidth);
                }
                rightAnchorLimitIndex = highestViewportStartColumnIndex;
                rightAnchorLimitOffset = highestViewportStart - highestViewportStartColumnLeft;
                if (!this._gridProperties.scrollHorizontallySmoothly) {
                    // Since we cannot show a partial column on left, this may prevent rightmost columns from being displayed in viewport
                    // Extend scrollable size (content size) so that the subsequent column can be shown on start when viewport is at end of content.
                    contentSize += (nextColumnLeft - highestViewportStart);
                    if (rightAnchorLimitOffset !== 0) {
                        rightAnchorLimitOffset = 0;
                        if (rightAnchorLimitIndex < columnCount - 1) {
                            rightAnchorLimitIndex++;
                        }
                    }
                }
            }

            anchorLimits = {
                startAnchorLimitIndex: leftAnchorLimitIndex,
                startAnchorLimitOffset: leftAnchorLimitOffset,
                finishAnchorLimitIndex: rightAnchorLimitIndex,
                finishAnchorLimitOffset: rightAnchorLimitOffset,
            }
        } else {
            anchorLimits = this.calculateColumnScrollInactiveAnchorLimits(gridRightAligned, columnCount, fixedColumnCount);
        }

        return {
            contentSize,
            contentOverflowed,
            anchorLimits,
        };
    }

    private calculateActiveNonFixedColumnsWidth() {
        const gridLinesVWidth = this._gridProperties.gridLinesVWidth;
        const columnCount = this._columnsManager.getActiveColumnCount();
        const fixedColumnCount = this._columnsManager.getFixedColumnCount();
        let result = 0;
        for (let i = fixedColumnCount; i < columnCount; i++) {
            result += this._columnsManager.getActiveColumnWidth(i);
        }

        if (gridLinesVWidth > 0) {
            const scrollableColumnCount = columnCount - fixedColumnCount;
            if (scrollableColumnCount > 1) {
                result += (scrollableColumnCount - 1) * gridLinesVWidth;
            }
        }

        return result;
    }
}

export namespace ScrollBehavior {
    export type BehaviourChangedEventer = (this: void) => void;
    export type ScrollEventer = (this: void, isX: boolean, newValue: number, index: number, offset: number) => void;
    export type GetRowHeightEventer = (this: void, y: number, subgrid: Subgrid) => number;
}
