import { ColumnsManager } from '../../components/column/columns-manager';
import { Subgrid } from '../../components/subgrid/subgrid';
import { SubgridsManager } from '../../components/subgrid/subgrids-manager';
import { ViewLayout } from '../../components/view/view-layout';
import { GridSettings } from '../../interfaces/grid-settings';

export class ScrollBehavior {
    private _scrollingActive = false;
    private _resizeScrollbarsTimeoutHandle: ReturnType<typeof setTimeout> | undefined;

    constructor(
        private readonly _gridSettings: GridSettings,
        private readonly _columnsManager: ColumnsManager,
        private readonly _subgridsManager: SubgridsManager,
        private readonly _viewLayout: ViewLayout,
    ) {
        // this.horizontalScroller.onchange = (x) => this.handleHScrollerChange(x);
        // this.verticalScroller.onchange = (y) => this.handleVScrollerChange(y);
        // this.verticalScroller.paging = {
        //     up: () => this.scrollPageUp(),
        //     down: () => this.scrollPageDown()
        // }

    }

    // destroy() {
    //     this.checkClearResizeScrollbarsTimeout();
    // }

    reset() {
        this._scrollingActive = false;
        // this.checkClearResizeScrollbarsTimeout();
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
     * @desc Scroll up one full page.
     */
    // scrollPageUp() {
    //     const firstScrollableSubgridRowIndex = this.gridProperties.fixedRowCount;
    //     const currentFocusY = currentFocusPoint.y;
    //     if (currentFocusY > firstScrollableSubgridRowIndex) {
    //         const lastViewportScrollableSubgridRowIndex = this.viewport.lastScrollableSubgridRowIndex;
    //         if (lastViewportScrollableSubgridRowIndex !== undefined) {
    //             const firstViewportScrollableSubgridRowIndex = this.viewport.firstScrollableSubgridRowIndex;
    //             if (firstViewportScrollableSubgridRowIndex === undefined) {
    //                 throw new AssertError('FUBNYPU87521');
    //             } else {
    //                 let maxScrollCount = lastViewportScrollableSubgridRowIndex - firstScrollableSubgridRowIndex;
    //                 if (maxScrollCount === 0) {
    //                     maxScrollCount = 1;
    //                 }
    //                 let newFocusY = currentFocusY - maxScrollCount;
    //                 if (newFocusY < firstScrollableSubgridRowIndex) {
    //                     newFocusY = firstScrollableSubgridRowIndex;
    //                 }
    //                 this.focus.setYCoordinate(newFocusY);
    //             }
    //         }
    //     }
    // }

    /**
     * @desc Scroll down one full page.
     */
    // scrollPageDown() {
    //     const lastScrollableSubgridRowIndex = this.mainSubgrid.getRowCount() - 1;
    //     const currentFocusY = currentFocusPoint.y;
    //     if (currentFocusY < lastScrollableSubgridRowIndex) {
    //         const lastViewportScrollableSubgridRowIndex = this.viewport.lastScrollableSubgridRowIndex;
    //         if (lastViewportScrollableSubgridRowIndex !== undefined) {
    //             const firstViewportScrollableSubgridRowIndex = this.viewport.firstScrollableSubgridRowIndex;
    //             if (firstViewportScrollableSubgridRowIndex === undefined) {
    //                 throw new AssertError('FUBNXPD87521');
    //             } else {
    //                 let maxScrollCount = lastViewportScrollableSubgridRowIndex - lastScrollableSubgridRowIndex;
    //                 if (maxScrollCount === 0) {
    //                     maxScrollCount = 1;
    //                 }
    //                 let newFocusY = currentFocusY + maxScrollCount;
    //                 if (newFocusY > lastScrollableSubgridRowIndex) {
    //                     newFocusY = lastScrollableSubgridRowIndex;
    //                 }
    //                 this.focus.setYCoordinate(newFocusY);
    //             }
    //         }
    //     }
    //     const rowNum = this._viewport.getPageDownRow();
    //     if (rowNum === undefined) {
    //         return undefined;
    //     } else {
    //         this.handleVScrollerChange(rowNum);
    //         return rowNum;
    //     }
    // }

    // scrollPageLeft() {
    //     const currentFocusSubgridX = this._focus.currentSubgridX;
    //     if (currentFocusSubgridX !== undefined) {
    //         const viewportFocusOffset = this.calculateViewportFocusOffset();
    //         const firstScrollableActiveColumnIndex = this._gridProperties.fixedColumnCount;
    //         if (currentFocusSubgridX > firstScrollableActiveColumnIndex) {
    //             this._viewport.getPageDownRow
    //             const lastViewportScrollableActiveColumnIndex = this.viewport.lastScrollableActiveColumnIndex;
    //             if (lastViewportScrollableActiveColumnIndex !== undefined) {
    //                 const firstViewportScrollableActiveColumnIndex = this.viewport.firstScrollableActiveColumnIndex;
    //                 if (firstViewportScrollableActiveColumnIndex === undefined) {
    //                     throw new AssertError('FUBNXPU87521');
    //                 } else {
    //                     let maxScrollCount = lastViewportScrollableActiveColumnIndex - firstScrollableActiveColumnIndex;
    //                     if (maxScrollCount === 0) {
    //                         maxScrollCount = 1;
    //                     }
    //                     let newFocusX = currentFocusSubgridX - maxScrollCount;
    //                     if (newFocusX < firstScrollableActiveColumnIndex) {
    //                         newFocusX = firstScrollableActiveColumnIndex;
    //                     }
    //                     this.focus.setXCoordinate(newFocusX);
    //                 }
    //             }
    //         }
    //     }
    // }

    // scrollPageRight() {
    //     const lastScrollableActiveColumnIndex = this.columnsManager.activeColumnCount - 1;
    //     const currentFocusX = currentFocusPoint.x;
    //     if (currentFocusX < lastScrollableActiveColumnIndex) {
    //         const lastViewportScrollableActiveColumnIndex = this.viewport.lastScrollableActiveColumnIndex;
    //         if (lastViewportScrollableActiveColumnIndex !== undefined) {
    //             const firstViewportScrollableActiveColumnIndex = this.viewport.firstScrollableActiveColumnIndex;
    //             if (firstViewportScrollableActiveColumnIndex === undefined) {
    //                 throw new AssertError('FUBNXPF87521');
    //             } else {
    //                 let maxScrollCount = lastViewportScrollableActiveColumnIndex - lastScrollableActiveColumnIndex;
    //                 if (maxScrollCount === 0) {
    //                     maxScrollCount = 1;
    //                 }
    //                 let newFocusX = currentFocusX + maxScrollCount;
    //                 if (newFocusX > lastScrollableActiveColumnIndex) {
    //                     newFocusX = lastScrollableActiveColumnIndex;
    //                 }
    //                 this.focus.setXCoordinate(newFocusX);
    //             }
    //         }
    //     }
    // }

    stepScroll(directionCanvasOffsetX: number, directionCanvasOffsetY: number) {
        let stepped = this.stepScrollColumn(directionCanvasOffsetX);
        if (this.stepScrollRow(directionCanvasOffsetY)) {
            stepped = true;
        }
        return stepped;
    }

    stepScrollColumn(directionCanvasOffsetX: number) {
        const viewLayout = this._viewLayout;
        const scrollableBounds = viewLayout.scrollableCanvasBounds;
        if (scrollableBounds === undefined) {
            return false;
        } else {
            let wantedMaximallyVisibleActiveColumnIndex: number | undefined;

            if (directionCanvasOffsetX < scrollableBounds.topLeft.x) {
                const firstVisibleScrollableColumnLeftOverflow = viewLayout.firstScrollableColumnLeftOverflow;
                const firstVisibleScrollableActiveColumnIndex = viewLayout.firstScrollableActiveColumnIndex;
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
                    const lastVisibleScrollableColumnLeftOverflow = viewLayout.lastScrollableColumnRightOverflow;
                    const lastVisibleScrollableActiveColumnIndex = viewLayout.lastScrollableActiveColumnIndex;
                    if (lastVisibleScrollableColumnLeftOverflow !== undefined && lastVisibleScrollableActiveColumnIndex !== undefined) {
                        if (lastVisibleScrollableColumnLeftOverflow > 0) {
                            wantedMaximallyVisibleActiveColumnIndex = lastVisibleScrollableActiveColumnIndex;
                        } else {
                            const lastScrollableActiveColumnIndex = this._columnsManager.activeColumnCount - 1;
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
                this._viewLayout.ensureColumnIsInView(wantedMaximallyVisibleActiveColumnIndex, true);
                return true;
            }
        }
    }

    stepScrollRow(directionCanvasOffsetY: number) {
        const viewLayout = this._viewLayout;
        const scrollableBounds = viewLayout.scrollableCanvasBounds;

        if (scrollableBounds === undefined) {
            return false;
        } else {
            if (directionCanvasOffsetY < scrollableBounds.topLeft.y) {
                const headerPlusFixedRowCount = this._subgridsManager.calculateHeaderPlusFixedRowCount();
                const firstVisibleScrollableRowIndex = viewLayout.firstScrollableRowIndex;
                if (firstVisibleScrollableRowIndex !== undefined && firstVisibleScrollableRowIndex > headerPlusFixedRowCount) {
                    this._viewLayout.scrollVerticalViewportBy(-1);
                    return true;
                } else {
                    return false;
                }
            } else {
                if (directionCanvasOffsetY >= scrollableBounds.exclusiveBottom) {
                    const subgridsManager = this._subgridsManager;
                    const headerRowCount = subgridsManager.calculateHeaderRowCount();
                    const lastScrollableRowIndex = headerRowCount + subgridsManager.mainSubgrid.getRowCount() - 1;
                    const lastVisibleScrollableRowIndex = viewLayout.lastScrollableRowIndex;
                    if (lastVisibleScrollableRowIndex !== undefined && lastVisibleScrollableRowIndex < lastScrollableRowIndex) {
                        this._viewLayout.scrollVerticalViewportBy(+1);
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

    // private processComputeCellsBoundsRequired() {
    //     this._viewLayout.compute(false);
    //     const viewportStart = this._viewLayout.calculateHorizontalScrollableLeft();
    //     this.horizontalScroller.setViewportStart(viewportStart);
    // }

    /**
     * @desc Set the vertical scroll value.
     * @param newValue - The new scroll value.
     * @internal
     */
    // private handleVScrollerChange(y: number) {
    //     y = Math.min(this._viewLayout.verticalScrollDimension.finish, Math.max(0, Math.round(y)));
    //     if (y !== this._viewLayout.rowScrollAnchorIndex) {
    //         // const oldY = this.vScrollValue;
    //         this._viewLayout.setVerticalViewportStart(y); // may need to be before this.behaviorChanged()
    //         this.scrollValueChangedNotification(false);
    //         setTimeout(() => {
    //             this._scrollEventer(false, y, -1, -1);
    //         }, 0);
    //     }
    // }

    /**
     * @desc Set the horizontal scroll value.
     * @param x - The new scroll value.
     * @internal
     */
    // private handleHScrollerChange(x: number) {
    //     const updated = this._viewLayout.scrollHorizontallyTo(
    //         this.horizontalScroller.viewportStart,
    //         this.horizontalScroller.viewportFinish,
    //         this._viewLayout.verticalScrollDimension.start,
    //         this._viewLayout.verticalScrollDimension.finish,
    //     );
    //     if (updated) {
    //         this._behaviorChangedEventer();
    //         this.scrollValueChangedNotification(true);
    //         setTimeout(() => {
    //             this._scrollEventer(true, x, this._viewLayout.columnScrollAnchorIndex, this._viewLayout.columnScrollAnchorOffset);
    //         }, 0);
    //     }
    // }

    // /** @internal */
    // private resizeScrollbars() {
    //     this.horizontalScroller.shortenBy(this.verticalScroller).resize();
    //     //this.sbVScroller.shortenBy(this.sbHScroller);
    //     this.verticalScroller.resize();
    // }

    /**
     * @desc Scroll values have changed, we've been notified.
     * @internal
     */
    // private setVScrollbarContentRange(finish: number) {
    //     this.verticalScroller.contentRange = {
    //         start: 0,
    //         finish: finish
    //     };
    // }

    // HScroller only calls when change has occurred so it sets force true
    // Eventually VScroller should also only call when changed
    // /** @internal */
    // private scrollValueChangedNotification(force: boolean) {
    //     const rowScrollAnchorIndex = this._viewLayout.rowScrollAnchorIndex;
    //     if (
    //         force ||
    //         rowScrollAnchorIndex !== this._sbPrevVScrollValue
    //     ) {
    //         this._sbPrevVScrollValue = rowScrollAnchorIndex;

    //         // if (this.cellEditor) {
    //         //     this.cellEditor.scrollValueChangedNotification();
    //         // }

    //         this._viewLayout.compute(false);
    //     }
    // }

    /**
     * @desc The data dimensions have changed, or our pixel boundaries have changed.
     * Adjust the scrollbar properties as necessary.
     * @internal
     */
    // public synchronizeScrollingBoundaries() {
        // this.updateHorizontalScroll(false);
        // this.updateVerticalScroll(false);

        // this._viewLayout.computeColumns(false);
        // const viewportStart = this._viewLayout.calculateHorizontalScrollableLeft();
        // this.horizontalScroller.setViewportStart(viewportStart);

        // schedule to happen *after* the repaint
        // if (this._resizeScrollbarsTimeoutHandle === undefined) {
        //     this._resizeScrollbarsTimeoutHandle = setTimeout(() => {
        //         this._resizeScrollbarsTimeoutHandle = undefined;
        //         this.resizeScrollbars()
        //     }, 0);
        // }
    // }

    // private checkClearResizeScrollbarsTimeout() {
    //     if (this._resizeScrollbarsTimeoutHandle !== undefined) {
    //         clearTimeout(this._resizeScrollbarsTimeoutHandle);
    //         this._resizeScrollbarsTimeoutHandle = undefined;
    //     }
    // }

    // public updateHorizontalScroll(recalculateView: boolean) {
        // const canvasBounds = this._canvasEx.getBounds();

        // const gridProps = this._gridSettings;
        // const gridRightAligned = gridProps.gridRightAligned;
        // const columnCount = this._columnsManager.activeColumnCount;
        // const fixedColumnCount = this._gridSettings.fixedColumnCount;

        // let scrollerContentStart: number;
        // if (fixedColumnCount === 0) {
        //     scrollerContentStart = 0;
        // } else {
            // const fixedColumnsWidth = this._columnsManager.calculateFixedColumnsWidth();
            // const fixedLinesVWidth = gridProps.fixedLinesVWidth ?? gridProps.gridLinesVWidth;
            // scrollerContentStart = fixedColumnsWidth + fixedLinesVWidth;
        // }
        // const scrollableColumnsViewportSize = canvasBounds.width - scrollerContentStart;

        // let scrollerContentFinish: number;
        // if (scrollableColumnsViewportSize <= 0) {
            // const anchorLimits = this.calculateColumnScrollInactiveAnchorLimits(gridRightAligned, columnCount, fixedColumnCount);
            // this._viewLayout.setColumnScrollAnchorLimits(false, anchorLimits);

        //     scrollerContentFinish = scrollerContentStart - 1;
        //     this.horizontalScroller.contentRange = {
        //         start: scrollerContentStart,
        //         finish: scrollerContentFinish // hMax
        //     };
        //     this.horizontalScroller.viewportSize = -1;
        // } else {
            // const contentSizeAndAnchorLimits = this.calculateColumnScrollContentSizeAndAnchorLimits(
            //     scrollerContentStart,
            //     scrollableColumnsViewportSize,
            //     gridRightAligned,
            //     columnCount,
            //     fixedColumnCount,
            // );
            // const { contentSize, contentOverflowed, anchorLimits } = contentSizeAndAnchorLimits;
            // this._viewLayout.setColumnScrollAnchorLimits(contentOverflowed, anchorLimits);

            // scrollerContentFinish = scrollerContentStart + contentSize - 1;
            // this.horizontalScroller.contentRange = {
            //     start: scrollerContentStart,
            //     finish: scrollerContentFinish // hMax
            // };
            // this.horizontalScroller.viewportSize = scrollableColumnsViewportSize;

            // if (this.horizontalScroller.hidden) {
            //     this._viewLayout.setColumnScrollAnchorToLimit(gridRightAligned)
            // }

        // }

        // if (recalculateView) {
        //     // this._viewLayout.computeColumns(false);
        //     const scrollableViewLeft = this._viewLayout.calculateHorizontalScrollableLeft();
        //     this.horizontalScroller.setViewportStart(scrollableViewLeft);
        // }
    // }

    // private updateVerticalScroll(recalculateView: boolean) {
    //     const mainSubgrid = this._subgridsManager.mainSubgrid;
    //     const numRows = mainSubgrid.getRowCount();
    //     const gridProps = this._gridSettings;
    //     const scrollableHeight = this._viewLayout.getVisibleScrollHeight();
    //     const lineGap = gridProps.gridLinesHWidth;
    //     let rowsHeight = 0;
    //     let lastPageRowCount = 0;

    //     while (lastPageRowCount < numRows && rowsHeight < scrollableHeight) {
    //         rowsHeight += mainSubgrid.getRowHeight(numRows - lastPageRowCount - 1) + lineGap;
    //         lastPageRowCount++;
    //     }
    //     if (rowsHeight > scrollableHeight) {
    //         lastPageRowCount--;
    //     }

    //     const vMax = Math.max(0, numRows - gridProps.fixedRowCount - lastPageRowCount);
    //     this.setVScrollbarContentRange(vMax);
    //     this.handleVScrollerChange(Math.min(this._viewLayout.rowScrollAnchorIndex, vMax));

    //     if (recalculateView) {
    //         this._viewLayout.invalidateVerticalAll(false);
    //     }
    // }

    // private calculateColumnScrollInactiveAnchorLimits(
    //     gridRightAligned: boolean,
    //     columnCount: number,
    //     fixedColumnCount: number
    // ): ViewLayout.ScrollAnchorLimits {
    //     let startAnchorLimitIndex: number;
    //     let finishAnchorLimitIndex: number;
    //     if (gridRightAligned) {
    //         finishAnchorLimitIndex = columnCount - 1;
    //         startAnchorLimitIndex = finishAnchorLimitIndex;
    //     } else {
    //         startAnchorLimitIndex = fixedColumnCount;
    //         finishAnchorLimitIndex = startAnchorLimitIndex;
    //     }
    //     return {
    //         startAnchorLimitIndex,
    //         startAnchorLimitOffset: 0,
    //         finishAnchorLimitIndex,
    //         finishAnchorLimitOffset: 0,
    //     };
    // }

    // private calculateColumnScrollContentSizeAndAnchorLimits(
    //     contentStart: number, // Fixed columns width + fixed gridline width
    //     viewportSize: number,
    //     gridRightAligned: boolean,
    //     columnCount: number,
    //     fixedColumnCount: number,
    // ): ViewLayout.ScrollContentSizeAndAnchorLimits {
    //     let contentSize = this.calculateActiveNonFixedColumnsWidth();
    //     let anchorLimits: ViewLayout.ScrollAnchorLimits;

    //     const contentOverflowed = contentSize > viewportSize && columnCount > fixedColumnCount
    //     if (contentOverflowed) {
    //         let leftAnchorLimitIndex: number;
    //         let leftAnchorLimitOffset: number;
    //         let rightAnchorLimitIndex: number;
    //         let rightAnchorLimitOffset: number;

    //         const gridLinesVWidth = this._gridSettings.gridLinesVWidth;
    //         if (gridRightAligned) {
    //             rightAnchorLimitIndex = columnCount - 1;
    //             rightAnchorLimitOffset = 0;
    //             let prevColumnGridLineFinish = contentStart - 1;
    //             const lowestViewportFinish = prevColumnGridLineFinish + viewportSize;
    //             let lowestViewportStartColumnIndex = fixedColumnCount;
    //             let lowestViewportStartColumnFinish = prevColumnGridLineFinish + this._columnsManager.getActiveColumnWidth(lowestViewportStartColumnIndex);
    //             while (lowestViewportStartColumnFinish <= lowestViewportFinish) {
    //                 prevColumnGridLineFinish = lowestViewportStartColumnFinish;
    //                 lowestViewportStartColumnIndex++;
    //                 lowestViewportStartColumnFinish = prevColumnGridLineFinish + (this._columnsManager.getActiveColumnWidth(lowestViewportStartColumnIndex) + gridLinesVWidth);
    //             }
    //             leftAnchorLimitIndex = lowestViewportStartColumnIndex;
    //             leftAnchorLimitOffset = lowestViewportStartColumnFinish - lowestViewportFinish;
    //             if (!this._gridSettings.scrollHorizontallySmoothly) {
    //                 // Since we cannot show a partial column on right, this may prevent leftmost columns from being displayed in viewport
    //                 // Extend scrollable size (content size) so that the previous column can be shown on end when viewport is at start of content.
    //                 contentSize += (lowestViewportFinish - prevColumnGridLineFinish);
    //                 if (leftAnchorLimitOffset !== 0) {
    //                     leftAnchorLimitOffset = 0;
    //                     if (leftAnchorLimitIndex > fixedColumnCount) {
    //                         leftAnchorLimitIndex--;
    //                     }
    //                 }
    //             }
    //         } else {
    //             leftAnchorLimitIndex = fixedColumnCount;
    //             leftAnchorLimitOffset = 0;
    //             const highestViewportStart = contentSize - viewportSize;
    //             let nextColumnLeft = contentSize;
    //             let highestViewportStartColumnIndex = columnCount - 1;
    //             let highestViewportStartColumnLeft = nextColumnLeft - this._columnsManager.getActiveColumnWidth(highestViewportStartColumnIndex);
    //             while (highestViewportStartColumnLeft > highestViewportStart) {
    //                 nextColumnLeft = highestViewportStartColumnLeft;
    //                 highestViewportStartColumnIndex--;
    //                 highestViewportStartColumnLeft = nextColumnLeft - (this._columnsManager.getActiveColumnWidth(highestViewportStartColumnIndex) + gridLinesVWidth);
    //             }
    //             rightAnchorLimitIndex = highestViewportStartColumnIndex;
    //             rightAnchorLimitOffset = highestViewportStart - highestViewportStartColumnLeft;
    //             if (!this._gridSettings.scrollHorizontallySmoothly) {
    //                 // Since we cannot show a partial column on left, this may prevent rightmost columns from being displayed in viewport
    //                 // Extend scrollable size (content size) so that the subsequent column can be shown on start when viewport is at end of content.
    //                 contentSize += (nextColumnLeft - highestViewportStart);
    //                 if (rightAnchorLimitOffset !== 0) {
    //                     rightAnchorLimitOffset = 0;
    //                     if (rightAnchorLimitIndex < columnCount - 1) {
    //                         rightAnchorLimitIndex++;
    //                     }
    //                 }
    //             }
    //         }

    //         anchorLimits = {
    //             startAnchorLimitIndex: leftAnchorLimitIndex,
    //             startAnchorLimitOffset: leftAnchorLimitOffset,
    //             finishAnchorLimitIndex: rightAnchorLimitIndex,
    //             finishAnchorLimitOffset: rightAnchorLimitOffset,
    //         }
    //     } else {
    //         anchorLimits = this.calculateColumnScrollInactiveAnchorLimits(gridRightAligned, columnCount, fixedColumnCount);
    //     }

    //     return {
    //         contentSize,
    //         contentOverflowed,
    //         anchorLimits,
    //     };
    // }

    // private calculateActiveNonFixedColumnsWidth() {
    //     const gridLinesVWidth = this._gridSettings.gridLinesVWidth;
    //     const columnCount = this._columnsManager.activeColumnCount;
    //     const fixedColumnCount = this._columnsManager.getFixedColumnCount();
    //     let result = 0;
    //     for (let i = fixedColumnCount; i < columnCount; i++) {
    //         result += this._columnsManager.getActiveColumnWidth(i);
    //     }

    //     if (gridLinesVWidth > 0) {
    //         const scrollableColumnCount = columnCount - fixedColumnCount;
    //         if (scrollableColumnCount > 1) {
    //             result += (scrollableColumnCount - 1) * gridLinesVWidth;
    //         }
    //     }

    //     return result;
    // }
}

export namespace ScrollBehavior {
    export type BehaviourChangedEventer = (this: void) => void;
    export type ScrollEventer = (this: void, isX: boolean, newValue: number, index: number, offset: number) => void;
    export type GetRowHeightEventer = (this: void, y: number, subgrid: Subgrid) => number;
}
