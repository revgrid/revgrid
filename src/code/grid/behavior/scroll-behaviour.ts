import { ColumnsManager } from '../column/columns-manager';
import { SubgridInterface } from '../common/subgrid-interface';
import { FinBar } from '../finbar/finbar';
import { GridProperties } from '../grid-properties';
import { Renderer } from '../renderer/renderer';
import { Subgrid } from '../subgrid/subgrid';
import { SubgridsManager } from '../subgrid/subgrids-manager';

export class ScrollBehavior {
    private _rowScrollAnchorIndex = 0;
    private sbPrevVScrollValue: number | undefined;
    private scrollingNow = false;
    private _resizeScrollbarsTimeoutHandle: ReturnType<typeof setTimeout> | undefined;

    constructor(
        private readonly _gridProperties: GridProperties,
        private readonly _columnsManager: ColumnsManager,
        private readonly _subgridsManager: SubgridsManager,
        private readonly renderer: Renderer,
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
        this.scrollingNow = false;
        this.sbPrevVScrollValue = undefined;
        this._rowScrollAnchorIndex = 0;
        this.checkClearResizeScrollbarsTimeout();
    }

    /** @internal */
    setScrollingNow(isItNow: boolean) {
        this.scrollingNow = isItNow;
    }

    /**
     * @returns The `scrollingNow` field.
     */
    isScrollingNow() {
        return this.scrollingNow;
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
        if (this.renderer.scrollColumnScrollAnchor(offset, this._gridProperties.gridRightAligned)) {
            this.renderer.computeCellsBounds();
            const viewportStart = this.calculateColumnScrollAnchorViewportStart();
            this.horizontalScroller.setViewportStart(viewportStart);
            return true;
        } else {
            return false;
        }
    }

    scrollViewHorizontallyBy(delta: number) {
        if (this.renderer.horizontalScrollableContentOverflowed) {
            this.horizontalScroller.scroll(delta);
        }
    }

    scrollHorizontal(delta: number) {
        this.horizontalScroller.scroll(delta);
    }

    scrollToMakeVisible(c: number, r: number, subgrid: SubgridInterface | undefined) {
        if (subgrid === undefined || subgrid === this._subgridsManager.mainSubgrid) {
            let delta: number;
            const gridRightAligned = this._gridProperties.gridRightAligned
            const scrollableColumnRange = this.renderer.scrollableColumnRange;
            const scrollableRowRange = this.renderer.scrollableRowRange;
            const fixedColumnCount = this._gridProperties.fixedColumnCount;
            const fixedRowCount = this._gridProperties.fixedRowCount;
            let computeCellsBoundsRequired = false;

            // scroll only if target not in fixed columns unless grid right aligned
            if (scrollableColumnRange !== undefined && (c >= fixedColumnCount || gridRightAligned)) {
                let anchorUpdated = false;
                if ((delta = c - scrollableColumnRange.start) < 0) {
                    // target is to left of scrollable columns
                    if (gridRightAligned) {
                        const {index, offset} = this.renderer.calculateColumnScrollAnchorToScrollIntoView(c, gridRightAligned, this.horizontalScroller.viewportSize);
                        anchorUpdated = this.renderer.setColumnScrollAnchor(index, offset);
                    } else {
                        anchorUpdated = this.renderer.setColumnScrollAnchor(c);
                    }
                } else {
                    if ((c - scrollableColumnRange.after) > 0) {
                        // target is to right of scrollable columns
                        if (gridRightAligned) {
                            anchorUpdated = this.renderer.setColumnScrollAnchor(c);
                        } else {
                            const {index, offset} = this.renderer.calculateColumnScrollAnchorToScrollIntoView(c, gridRightAligned, this.horizontalScroller.viewportSize);
                            anchorUpdated = this.renderer.setColumnScrollAnchor(index, offset);
                        }
                    }
                }

                if (anchorUpdated) {
                    computeCellsBoundsRequired = true;
                }
            }

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

            if (computeCellsBoundsRequired) {
                this.renderer.computeCellsBounds();
                const viewportStart = this.calculateColumnScrollAnchorViewportStart();
                this.horizontalScroller.setViewportStart(viewportStart);
            }
        }
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
        const updated = this.renderer.updateColumnScrollAnchor(
            this.horizontalScroller.viewportStart,
            this.horizontalScroller.viewportFinish,
            this.horizontalScroller.contentStart,
            this.horizontalScroller.contentFinish
        );
        if (updated) {
            this._behaviorChangedEventer();
            this.scrollValueChangedNotification(true);
            setTimeout(() => {
                this._scrollEventer(true, x, this.renderer.columnScrollAnchorIndex, this.renderer.columnScrollAnchorOffset);
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
            this._rowScrollAnchorIndex !== this.sbPrevVScrollValue
        ) {
            this.sbPrevVScrollValue = this._rowScrollAnchorIndex;

            // if (this.cellEditor) {
            //     this.cellEditor.scrollValueChangedNotification();
            // }

            this.renderer.computeCellsBounds();
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

        this.renderer.computeCellsBounds();
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
        const bounds = this.renderer.getBounds();

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
        const scrollableColumnsViewportSize = bounds.width - scrollerContentStart;

        let scrollerContentFinish: number;
        if (scrollableColumnsViewportSize <= 0) {
            const anchorLimits = this.calculateColumnScrollInactiveAnchorLimits(gridRightAligned, columnCount, fixedColumnCount);
            this.renderer.setColumnScrollAnchorLimits(false, anchorLimits);

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
            this.renderer.setColumnScrollAnchorLimits(contentOverflowed, anchorLimits);

            scrollerContentFinish = scrollerContentStart + contentSize - 1;
            this.horizontalScroller.contentRange = {
                start: scrollerContentStart,
                finish: scrollerContentFinish // hMax
            };
            this.horizontalScroller.viewportSize = scrollableColumnsViewportSize;

            if (this.horizontalScroller.hidden) {
                this.renderer.setColumnScrollAnchorToLimit(gridRightAligned)
            }

        }

        if (recalculateView) {
            this.renderer.computeCellsBounds();
            const viewportStart = this.calculateColumnScrollAnchorViewportStart();
            this.horizontalScroller.setViewportStart(viewportStart);
        }
    }

    private updateVerticalScroll(recalculateView: boolean) {
        const mainSubgrid = this._subgridsManager.mainSubgrid;
        const numRows = mainSubgrid.getRowCount();
        const gridProps = this._gridProperties;
        const scrollableHeight = this.renderer.getVisibleScrollHeight();
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
            this.renderer.computeCellsBounds();
        }
    }

    /**
     * @desc Scroll up one full page.
     */
    pageUp() {
        const rowNum = this.renderer.getPageUpRow();
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
        const rowNum = this.renderer.getPageDownRow();
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
            const finish = this.renderer.calculateColumnScrollAnchorViewportFinish(this.horizontalScroller.contentFinish);
            return finish - this.horizontalScroller.viewportSize + 1;
        } else {
            return this.renderer.calculateColumnScrollAnchorViewportStart(this.horizontalScroller.contentStart);
        }
    }

    private calculateColumnScrollInactiveAnchorLimits(
        gridRightAligned: boolean,
        columnCount: number,
        fixedColumnCount: number
    ): Renderer.ScrollAnchorLimits {
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
    ): Renderer.ScrollContentSizeAndAnchorLimits {
        let contentSize = this.calculateActiveNonFixedColumnsWidth();
        let anchorLimits: Renderer.ScrollAnchorLimits;

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
