import { GridSettings } from '../../interfaces/grid-settings';
import { HorizontalVertical } from '../../lib/types';
import { CanvasManager } from '../canvas/canvas-manager';
import { ColumnsManager } from '../column/columns-manager';
import { ScrollDimension } from './scroll-dimension';

export class HorizontalScrollDimension extends ScrollDimension {
    constructor(
        private readonly _gridSettings: GridSettings,
        canvasManager: CanvasManager,
        private readonly _columnsManager: ColumnsManager,
    ) {
        super(
            HorizontalVertical.Horizontal,
            canvasManager,
        );
    }

    override reset() {
        const anchorLimits = this.calculateColumnScrollInactiveAnchorLimits();
        this.setDimensionValues(undefined, undefined, undefined, false, undefined, anchorLimits);

        super.reset();
    }

    calculateLimitedScrollAnchorFromViewportStart(viewportStart: number): ScrollDimension.Anchor {
        const anchor = this.calculateScrollAnchorFromViewportStart(viewportStart);
        return this.calculateLimitedScrollAnchor(anchor.index, anchor.offset);
    }

    /**
     * Calculate the scroll anchor to bring a column just but fully into the view. Note, only use when column is on the opposite side of scroll anchor
     * @param activeColumnIndex - index of column to bring into view
     * @returns Scroll Anchor which will ensure the column is displayed
     */
    calculateColumnScrollAnchorToScrollIntoView(activeColumnIndex: number, gridRightAligned: boolean): ScrollDimension.Anchor {
        this.ensureValidOutsideAnimationFrame();

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
                left -= (this._columnsManager.getActiveColumnRoundedWidth(index) + gridLinesVWidth);
            }
            // calculate viewportFinish needed to just fit in column
            const viewportFinishPlus1 = left + this.size;
            // find column which finishes at or crosses this viewport Finish
            let rightPlus1 = left + this._columnsManager.getActiveColumnRoundedWidth(index);
            while (rightPlus1 < viewportFinishPlus1) {
                index++;
                rightPlus1 += (this._columnsManager.getActiveColumnRoundedWidth(index) + gridLinesVWidth);
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
                left += (this._columnsManager.getActiveColumnRoundedWidth(index) + gridLinesVWidth);
                index++;
            }
            // calculate relative right of activeColumnIndex;
            const rightPlus1 = left + this._columnsManager.getActiveColumnRoundedWidth(index);
            // calculate viewportStart needed to just fit in column
            const viewportStart = rightPlus1 - this.viewportSize;
            // find column which starts at or crosses this viewport Start
            while (left > viewportStart) {
                index--;
                left -= (this._columnsManager.getActiveColumnRoundedWidth(index) + gridLinesVWidth);
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

    isScrollAnchorWithinStartLimit(index: number, offset: number) {
        const startScrollAnchorLimitIndex = this.startScrollAnchorLimitIndex;
        if (index > startScrollAnchorLimitIndex) {
            return true;
        } else {
            if (index < startScrollAnchorLimitIndex) {
                return false;
            } else {
                if (this._gridSettings.gridRightAligned) {
                    return offset <= this.startScrollAnchorLimitOffset;
                } else {
                    return offset >= this.startScrollAnchorLimitOffset;
                }
            }
        }
    }

    isScrollAnchorWithinFinishLimit(index: number, offset: number) {
        const finishScrollAnchorLimitIndex = this.finishScrollAnchorLimitIndex;
        if (index < finishScrollAnchorLimitIndex) {
            return true;
        } else {
            if (index > finishScrollAnchorLimitIndex) {
                return false;
            } else {
                if (this._gridSettings.gridRightAligned) {
                    return offset >= this.finishScrollAnchorLimitOffset;
                } else {
                    return offset <= this.finishScrollAnchorLimitOffset;
                }
            }
        }
    }

    calculateLimitedScrollAnchor(index: number, offset: number): ScrollDimension.Anchor {
        if (!this.isScrollAnchorWithinStartLimit(index, offset)) {
            index = this.startScrollAnchorLimitIndex;
            offset = this.startScrollAnchorLimitOffset;
        } else {
            if (!this.isScrollAnchorWithinFinishLimit(index, offset)) {
                index = this.finishScrollAnchorLimitIndex;
                offset = this.finishScrollAnchorLimitOffset;
            }
        }

        return {
            index,
            offset
        };
    }

    protected override compute() {
        // called within Animation Frame

        const canvasBounds = this._canvasEx.getBounds();

        const scrollStart = this.calculateScrollStart();
        const viewportSize = canvasBounds.width - scrollStart;

        if (viewportSize <= 0) {
            const anchorLimits = this.calculateColumnScrollInactiveAnchorLimits();
            this.setDimensionValues(undefined, undefined, undefined, true, undefined, anchorLimits);
        } else {
            const contentSizeAndAnchorLimits = this.calculateScrollableSizeAndAnchorLimits(
                scrollStart,
                viewportSize,
            );
            const { scrollableSize, overflowed, anchorLimits } = contentSizeAndAnchorLimits;
            this.setDimensionValues(scrollStart, scrollableSize, viewportSize, true, overflowed, anchorLimits);
        }
    }

    private calculateScrollStart (): number {
        const gridSettings = this._gridSettings;
        const fixedColumnCount = gridSettings.fixedColumnCount;
        if (fixedColumnCount === 0) {
            return 0;
        } else {
            const fixedColumnsWidth = this._columnsManager.calculateFixedColumnsWidth();
            const fixedLinesVWidth = gridSettings.fixedLinesVWidth ?? gridSettings.gridLinesVWidth;
            return  fixedColumnsWidth + fixedLinesVWidth;
        }
    }

    private calculateScrollableSizeAndAnchorLimits(
        scrollableStart: number, // Fixed columns width + fixed gridline width
        viewportSize: number,
    ): ScrollDimension.ScrollableSizeAndAnchorLimits {
        const gridSettings = this._gridSettings;
        const gridRightAligned = gridSettings.gridRightAligned;
        const fixedColumnCount = gridSettings.fixedColumnCount;
        const columnCount = this._columnsManager.activeColumnCount;

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
                let lowestViewportStartColumnFinish = prevColumnGridLineFinish + this._columnsManager.getActiveColumnRoundedWidth(lowestViewportStartColumnIndex);
                while (lowestViewportStartColumnFinish <= lowestViewportFinish) {
                    prevColumnGridLineFinish = lowestViewportStartColumnFinish;
                    lowestViewportStartColumnIndex++;
                    lowestViewportStartColumnFinish = prevColumnGridLineFinish + (this._columnsManager.getActiveColumnRoundedWidth(lowestViewportStartColumnIndex) + gridLinesVWidth);
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
                const leftAnchor = this.calculateLeftMostAnchorLimit();
                leftAnchorLimitIndex = leftAnchor.index;
                leftAnchorLimitOffset = leftAnchor.offset;
                const highestViewportStart = scrollableSize - viewportSize;
                let nextColumnLeft = scrollableSize;
                let highestViewportStartColumnIndex = columnCount - 1;
                let highestViewportStartColumnLeft = nextColumnLeft - this._columnsManager.getActiveColumnRoundedWidth(highestViewportStartColumnIndex);
                while (highestViewportStartColumnLeft > highestViewportStart) {
                    nextColumnLeft = highestViewportStartColumnLeft;
                    highestViewportStartColumnIndex--;
                    highestViewportStartColumnLeft = nextColumnLeft - (this._columnsManager.getActiveColumnRoundedWidth(highestViewportStartColumnIndex) + gridLinesVWidth);
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
            anchorLimits = this.calculateColumnScrollInactiveAnchorLimits();
        }

        return {
            scrollableSize,
            overflowed,
            anchorLimits,
        };
    }

    private calculateColumnScrollInactiveAnchorLimits(): ScrollDimension.ScrollAnchorLimits {
        let anchor: ScrollDimension.Anchor;
        if (this._gridSettings.gridRightAligned) {
            anchor = this.calculateRightMostAnchorLimit();
        } else {
            anchor = this.calculateLeftMostAnchorLimit();
        }
        return {
            startAnchorLimitIndex: anchor.index,
            startAnchorLimitOffset: anchor.offset,
            finishAnchorLimitIndex: anchor.index,
            finishAnchorLimitOffset: anchor.offset,
        };
    }

    private calculateLeftMostAnchorLimit(): ScrollDimension.Anchor {
        return {
            index: this._gridSettings.fixedColumnCount,
            offset: 0,
        };
    }
    private calculateRightMostAnchorLimit(): ScrollDimension.Anchor {
        if (this._gridSettings.gridRightAligned) {
            return {
                index: this._columnsManager.activeColumnCount - 1,
                offset: 0,
            };
        } else {
            const fixedColumnCount = this._gridSettings.fixedColumnCount;
            const columnsManager = this._columnsManager;
            let index: number | undefined;
            let offset: number | undefined;
            for (let columnIndex = columnsManager.activeColumnCount - 1; columnIndex >= fixedColumnCount; columnIndex--) {
                const width = columnsManager.getActiveColumnRoundedWidth(columnIndex);
                if (width > 0) {
                    index = columnIndex;
                    offset = width - 1;
                    break;
                }
            }

            if (index === undefined || offset === undefined) {
                index = 0;
                offset = 0;
            }

            return {
                index,
                offset,
            };
        }
    }

    private calculateActiveNonFixedColumnsWidth() {
        const gridLinesVWidth = this._gridSettings.gridLinesVWidth;
        const columnCount = this._columnsManager.activeColumnCount;
        const fixedColumnCount = this._columnsManager.getFixedColumnCount();
        let result = 0;
        for (let i = fixedColumnCount; i < columnCount; i++) {
            result += this._columnsManager.getActiveColumnRoundedWidth(i);
        }

        if (gridLinesVWidth > 0) {
            const scrollableColumnCount = columnCount - fixedColumnCount;
            if (scrollableColumnCount > 1) {
                result += (scrollableColumnCount - 1) * gridLinesVWidth;
            }
        }

        return result;
    }

    private calculateScrollAnchorFromViewportStart(viewportStart: number): ScrollDimension.Anchor {
        this.ensureValidOutsideAnimationFrame();

        viewportStart = Math.round(viewportStart);

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
            const viewportAfter = viewportStart + viewportSize;
            const scrollableAfter = scrollableStart + this.size;
            if (viewportAfter >= scrollableAfter) {
                return this.calculateRightMostAnchorLimit();
            } else {
                let prevColumnLeft = scrollableAfter;
                let columnLeft: number;
                let lastColumnDone = false;
                for (let i = columnCount - 1; i >= fixedColumnCount; i--) {
                    if (lastColumnDone) {
                        prevColumnLeft -= gridLinesVWidth;
                    } else {
                        lastColumnDone = true;
                    }
                    const width = this._columnsManager.getActiveColumnRoundedWidth(i);
                    if (width > 0) {
                        columnLeft = prevColumnLeft - width;
                        if (viewportAfter <= columnLeft) {
                            prevColumnLeft = columnLeft;
                        } else {
                            let offset: number;
                            if (!scrollHorizontallySmoothly) {
                                offset = 0;
                            } else {
                                const columnAfter = columnLeft + width;
                                offset = columnAfter - viewportAfter;
                            }
                            return {
                                index: i,
                                offset,
                            };
                        }
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
                nextLeft = this._columnsManager.getActiveColumnRoundedWidth(i) + gridLinesVWidth + left;
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
}
