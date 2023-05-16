import { GridSettings } from '../../interfaces/grid-settings';
import { HorizontalVertical } from '../../lib/types';
import { CanvasEx } from '../canvas-ex/canvas-ex';
import { ColumnsManager } from '../column/columns-manager';
import { ScrollDimension } from './scroll-dimension';

export class HorizontalScrollDimension extends ScrollDimension {
    constructor(
        private readonly _gridSettings: GridSettings,
        canvasEx: CanvasEx,
        private readonly _columnsManager: ColumnsManager,
        viewportStartChangedEventer: ScrollDimension.ViewportStartChangedEventer,
    ) {
        super(
            HorizontalVertical.Horizontal,
            canvasEx,
            viewportStartChangedEventer,
        );
    }

    override reset() {
        const index = this._columnsManager.getFixedColumnCount();
        const offset = 0;
        const anchorLimits: ScrollDimension.ScrollAnchorLimits = {
            startAnchorLimitIndex: index,
            startAnchorLimitOffset: offset,
            finishAnchorLimitIndex: index,
            finishAnchorLimitOffset: offset,
        }
        this.setDimensionValues(undefined, undefined, undefined, undefined, anchorLimits);

        super.reset();
    }

    calculateColumnScrollAnchor(viewportStart: number): ScrollDimension.Anchor {
        this.ensureValid();

        // viewportFinish: number, _start: number, contentFinish: number
        const scrollableStart = this.start;
        const columnCount = this._columnsManager.activeColumnCount;
        const fixedColumnCount = this._columnsManager.getFixedColumnCount();
        const gridProps = this._gridSettings;
        const gridLinesVWidth = gridProps.gridLinesVWidth;
        const gridRightAligned = gridProps.gridRightAligned;
        const scrollHorizontallySmoothly = gridProps.scrollHorizontallySmoothly;

        if (gridRightAligned) {
            const viewportSize = this.viewportSize;
            const viewportFinish = viewportStart + viewportSize - 1;
            const scrollableFinish = scrollableStart + this.size - 1;
            if (viewportFinish >= scrollableFinish) {
                return {
                    index: columnCount - 1,
                    offset: 0
                };
            } else {
                let prevColumnLeft = scrollableFinish;
                let columnLeft: number;
                let lastColumnDone = false;
                for (let i = columnCount - 1; i >= fixedColumnCount; i--) {
                    columnLeft = prevColumnLeft - this._columnsManager.getActiveColumnWidth(i);
                    if (lastColumnDone) {
                        columnLeft -= gridLinesVWidth;
                    } else {
                        lastColumnDone = true;
                    }

                    if (viewportFinish < columnLeft) {
                        prevColumnLeft = columnLeft;
                    } else {
                        let offset: number;
                        if (!scrollHorizontallySmoothly) {
                            offset = 0;
                        } else {
                            offset = Math.ceil(prevColumnLeft - viewportFinish - 1);
                        }
                        return {
                            index: i,
                            offset,
                        };
                    }
                }
                return {
                    index: fixedColumnCount,
                    offset: 0,
                };
            }
        } else {
            let left = scrollableStart;
            let nextLeft: number;
            for (let i = fixedColumnCount; i < columnCount; i++) {
                nextLeft = this._columnsManager.getActiveColumnWidth(i) + gridLinesVWidth + left;
                if (viewportStart > nextLeft) {
                    left = nextLeft;
                } else {
                    let index: number;
                    if (viewportStart === nextLeft) {
                        index = i + 1;
                        left = nextLeft;
                    } else {
                        index = i;
                    }
                    let offset: number;
                    if (!scrollHorizontallySmoothly) {
                        offset = 0;
                    } else {
                        offset = Math.ceil(viewportStart - left);
                    }
                    return {
                        index,
                        offset
                    };
                }
            }

            let index: number;
            if (columnCount === fixedColumnCount) {
                index = fixedColumnCount;
            } else {
                index = columnCount -1;
            }
            return {
                index,
                offset: 0,
            };
        }
    }

    /**
     * Calculate the scroll anchor to bring a column just but fully into the view. Note, only use when column is on the opposite side of scroll anchor
     * @param activeColumnIndex - index of column to bring into view
     * @returns Scroll Anchor which will ensure the column is displayed
     */
    calculateColumnScrollAnchorToScrollIntoView(activeColumnIndex: number, gridRightAligned: boolean): ScrollDimension.Anchor {
        this.ensureValid();

        const gridProperties = this._gridSettings;
        const gridLinesVWidth = gridProperties.gridLinesVWidth;
        let index: number;
        let offset: number;

        if (gridRightAligned) {
            index = this._columnsManager.activeColumnCount;
            // calculate relative left of activeColumnIndex
            let left = gridLinesVWidth;
            while (index >= activeColumnIndex) {
                index--;
                left -= (this._columnsManager.getActiveColumnWidth(index) + gridLinesVWidth);
            }
            // calculate viewportFinish needed to just fit in column
            const viewportFinishPlus1 = left + this.size;
            // find column which finishes at or crosses this viewport Finish
            let rightPlus1 = left + this._columnsManager.getActiveColumnWidth(index);
            while (rightPlus1 < viewportFinishPlus1) {
                index++;
                rightPlus1 += (this._columnsManager.getActiveColumnWidth(index) + gridLinesVWidth);
            }
            // work out index and offset
            if (rightPlus1 === viewportFinishPlus1) {
                // column finishes exactly at viewportFinish.
                offset = 0;
            } else {
                if (gridProperties.scrollHorizontallySmoothly) {
                    // can display this column partially
                    offset = rightPlus1 - viewportFinishPlus1;
                } else {
                    // use previous column to ensure target is fully displayed
                    index--;
                    offset = 0;
                }
            }

        } else {
            index = this._columnsManager.getFixedColumnCount();
            // calculate relative left of activeColumnIndex
            let left = 0;
            while (index < activeColumnIndex) {
                left += (this._columnsManager.getActiveColumnWidth(index) + gridLinesVWidth);
                index++;
            }
            // calculate relative right of activeColumnIndex;
            const rightPlus1 = left + this._columnsManager.getActiveColumnWidth(index);
            // calculate viewportStart needed to just fit in column
            const viewportStart = rightPlus1 - this.viewportSize;
            // find column which starts at or crosses this viewport Start
            while (left > viewportStart) {
                index--;
                left -= (this._columnsManager.getActiveColumnWidth(index) + gridLinesVWidth);
            }
            // work out index and offset
            if (left === viewportStart) {
                // column starts exactly at viewportStart.
                offset = 0;
            } else {
                if (gridProperties.scrollHorizontallySmoothly) {
                    // can display this column partially
                    offset = viewportStart - left;
                } else {
                    // use next column to ensure target is fully displayed
                    index++;
                    offset = 0;
                }
            }
        }

        return {
            index,
            offset
        }
    }

    protected override compute() {
        // called within Animation Frame

        const canvasBounds = this._canvasEx.getBounds();

        const gridSettings = this._gridSettings;
        const gridRightAligned = gridSettings.gridRightAligned;
        const columnCount = this._columnsManager.activeColumnCount;
        const fixedColumnCount = gridSettings.fixedColumnCount;

        let scrollableStart: number;
        if (fixedColumnCount === 0) {
            scrollableStart = 0;
        } else {
            const fixedColumnsWidth = this._columnsManager.calculateFixedColumnsWidth();
            const fixedLinesVWidth = gridSettings.fixedLinesVWidth ?? gridSettings.gridLinesVWidth;
            scrollableStart = fixedColumnsWidth + fixedLinesVWidth;
        }
        const viewportSize = canvasBounds.width - scrollableStart;

        if (viewportSize <= 0) {
            const anchorLimits = this.calculateColumnScrollInactiveAnchorLimits(gridRightAligned, columnCount, fixedColumnCount);
            this.setDimensionValues(undefined, undefined, undefined, undefined, anchorLimits);
        } else {
            const contentSizeAndAnchorLimits = this.calculateScrollableSizeAndAnchorLimits(
                scrollableStart,
                viewportSize,
                gridRightAligned,
                columnCount,
                fixedColumnCount,
            );
            const { scrollableSize, overflowed, anchorLimits } = contentSizeAndAnchorLimits;
            this.setDimensionValues(scrollableStart, scrollableSize, viewportSize, overflowed, anchorLimits);
        }
    }

    private calculateScrollableSizeAndAnchorLimits(
        scrollableStart: number, // Fixed columns width + fixed gridline width
        viewportSize: number,
        gridRightAligned: boolean,
        columnCount: number,
        fixedColumnCount: number,
    ): ScrollDimension.ScrollableSizeAndAnchorLimits {
        let scrollableSize = this.calculateActiveNonFixedColumnsWidth();
        let anchorLimits: ScrollDimension.ScrollAnchorLimits;

        const overflowed = scrollableSize > viewportSize && columnCount > fixedColumnCount
        if (overflowed) {
            let leftAnchorLimitIndex: number;
            let leftAnchorLimitOffset: number;
            let rightAnchorLimitIndex: number;
            let rightAnchorLimitOffset: number;

            const gridLinesVWidth = this._gridSettings.gridLinesVWidth;
            if (gridRightAligned) {
                rightAnchorLimitIndex = columnCount - 1;
                rightAnchorLimitOffset = 0;
                let prevColumnGridLineFinish = scrollableStart - 1;
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
                if (!this._gridSettings.scrollHorizontallySmoothly) {
                    // Since we cannot show a partial column on right, this may prevent leftmost columns from being displayed in viewport
                    // Extend scrollable size (content size) so that the previous column can be shown on end when viewport is at start of content.
                    scrollableSize += (lowestViewportFinish - prevColumnGridLineFinish);
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
                const highestViewportStart = scrollableSize - viewportSize;
                let nextColumnLeft = scrollableSize;
                let highestViewportStartColumnIndex = columnCount - 1;
                let highestViewportStartColumnLeft = nextColumnLeft - this._columnsManager.getActiveColumnWidth(highestViewportStartColumnIndex);
                while (highestViewportStartColumnLeft > highestViewportStart) {
                    nextColumnLeft = highestViewportStartColumnLeft;
                    highestViewportStartColumnIndex--;
                    highestViewportStartColumnLeft = nextColumnLeft - (this._columnsManager.getActiveColumnWidth(highestViewportStartColumnIndex) + gridLinesVWidth);
                }
                rightAnchorLimitIndex = highestViewportStartColumnIndex;
                rightAnchorLimitOffset = highestViewportStart - highestViewportStartColumnLeft;
                if (!this._gridSettings.scrollHorizontallySmoothly) {
                    // Since we cannot show a partial column on left, this may prevent rightmost columns from being displayed in viewport
                    // Extend scrollable size (content size) so that the subsequent column can be shown on start when viewport is at end of content.
                    scrollableSize += (nextColumnLeft - highestViewportStart);
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
            scrollableSize,
            overflowed,
            anchorLimits,
        };
    }

    private calculateColumnScrollInactiveAnchorLimits(
        gridRightAligned: boolean,
        columnCount: number,
        fixedColumnCount: number
    ): ScrollDimension.ScrollAnchorLimits {
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

    private calculateActiveNonFixedColumnsWidth() {
        const gridLinesVWidth = this._gridSettings.gridLinesVWidth;
        const columnCount = this._columnsManager.activeColumnCount;
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
