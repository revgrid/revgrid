import { RevSchemaField } from '../../../common';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../../settings/internal-api';
import { RevCanvas } from '../canvas/canvas';
import { RevColumnsManager } from '../column/columns-manager';
import { RevScrollDimension } from './scroll-dimension';

export class RevHorizontalScrollDimension<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevScrollDimension<BGS> {
    constructor(
        gridSettings: RevGridSettings,
        canvas: RevCanvas<BGS>,
        private readonly _columnsManager: RevColumnsManager<BCS, SF>,
    ) {
        super(
            RevScrollDimension.AxisId.horizontal,
            gridSettings,
            canvas,
        );
    }

    // override reset() {
    //     const anchorLimits = this.calculateColumnScrollInactiveAnchorLimits();
    //     this.setComputedValues(undefined, undefined, undefined, false, undefined, anchorLimits);

    //     super.reset();
    // }

    calculateLimitedScrollAnchorFromViewportStart(viewportStart: number): RevScrollDimension.Anchor {
        const anchor = this.calculateScrollAnchorFromViewportStart(viewportStart);
        return this.calculateLimitedScrollAnchor(anchor.index, anchor.offset);
    }

    /**
     * Calculate the scroll anchor to bring a column just but fully into the view. Note, only use when column is on the opposite side of scroll anchor
     * @param activeColumnIndex - index of column to bring into view
     * @returns Scroll Anchor which will ensure the column is displayed
     */
    calculateColumnScrollAnchorToScrollIntoView(activeColumnIndex: number, gridRightAligned: boolean): RevScrollDimension.Anchor {
        this.ensureComputedOutsideAnimationFrame();

        const gridSettings = this._gridSettings;
        const gridLinesVWidth = gridSettings.verticalGridLinesWidth;
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
                if (gridSettings.scrollHorizontallySmoothly) {
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
                if (gridSettings.scrollHorizontallySmoothly) {
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

    calculateHorizontalScrollableLeft(columnScrollAnchorIndex: number, columnScrollAnchorOffset: number): number {
        const gridRightAligned = this._gridSettings.gridRightAligned;
        if (gridRightAligned) {
            const finish = this.calculateScrollableViewRightUsingDimensionFinish(columnScrollAnchorIndex, columnScrollAnchorOffset);
            return finish - this.viewportSize + 1;
        } else {
            return this.calculateScrollableViewLeftUsingDimensionStart(columnScrollAnchorIndex, columnScrollAnchorOffset);
        }
    }

    protected override compute() {
        // called within Animation Frame

        const scrollStart = this.calculateScrollStart();
        const viewportSize = this._canvas.flooredWidth - scrollStart;
        let startAnchor: RevScrollDimension.Anchor;
        let finishAnchor: RevScrollDimension.Anchor;
        let scrollSize: number;

        if (this._gridSettings.gridRightAligned) {
            const scrollSizeAndAnchor = this.calculateRightAlignedGridLeftAnchorLimit(scrollStart, viewportSize);
            startAnchor = scrollSizeAndAnchor.anchor;
            scrollSize = scrollSizeAndAnchor.scrollSize;
            if (startAnchor.index < 0) {
                finishAnchor = RevScrollDimension.invalidAnchor;
            } else {
                const lastColumnIndex = this._columnsManager.activeColumnCount - 1;
                finishAnchor = {
                    index: lastColumnIndex,
                    offset: 0,
                };
            }
        } else {
            const scrollSizeAndAnchor = this.calculateNotRightAlignedGridRightAnchorLimit(scrollStart, viewportSize);
            finishAnchor = scrollSizeAndAnchor.anchor;
            scrollSize = scrollSizeAndAnchor.scrollSize;
            if (finishAnchor.index < 0) {
                startAnchor = RevScrollDimension.invalidAnchor;
            } else {
                startAnchor = {
                    index: this._gridSettings.fixedColumnCount,
                    offset: 0,
                };
            }
        }

        let viewportCoverageExtent: RevScrollDimension.ViewportCoverageExtent;
        if (viewportSize <= 0) {
            viewportCoverageExtent = RevScrollDimension.ViewportCoverageExtent.None;
        } else {
            if (viewportSize < scrollSize) {
                viewportCoverageExtent = RevScrollDimension.ViewportCoverageExtent.Partial;
            } else {
                viewportCoverageExtent = RevScrollDimension.ViewportCoverageExtent.Full;
            }
        }

        this.setComputedValues(
            scrollStart,
            scrollSize,
            viewportSize,
            true,
            viewportCoverageExtent,
            startAnchor,
            finishAnchor,
        );
    }

    private calculateScrollStart (): number {
        const gridSettings = this._gridSettings;
        const fixedColumnCount = gridSettings.fixedColumnCount;
        if (fixedColumnCount === 0) {
            return 0;
        } else {
            const fixedColumnsWidth = this._columnsManager.calculateFixedColumnsWidth();
            const fixedLinesVWidth = gridSettings.verticalFixedLineWidth ?? gridSettings.verticalGridLinesWidth;
            return  fixedColumnsWidth + fixedLinesVWidth;
        }
    }

    private calculateNotRightAlignedGridRightAnchorLimit(scrollStart: number, viewportSize: number): RevScrollDimension.ScrollSizeAndAnchor {
        const gridSettings = this._gridSettings;
        const fixedColumnCount = gridSettings.fixedColumnCount;
        const columnCount = this._columnsManager.activeColumnCount;
        if (columnCount <= fixedColumnCount) {
            return {
                anchor: RevScrollDimension.invalidAnchor,
                scrollSize: 0,
            }
        } else {
            let scrollSize = this.calculateActiveNonFixedColumnsWidth();
            if (scrollSize === 0) {
                return {
                    anchor: RevScrollDimension.invalidAnchor,
                    scrollSize: 0,
                }
            } else {
                const verticalGridLinesWidth = gridSettings.verticalGridLinesWidth;

                let anchorIndex: number;
                let anchorOffset: number;
                let highestViewportStart = scrollSize - viewportSize;
                if (highestViewportStart < 0) {
                    highestViewportStart = 0;
                }
                let nextColumnLeft = scrollSize;
                let highestViewportStartColumnIndex = columnCount - 1;
                let highestViewportStartColumnLeft = nextColumnLeft - this._columnsManager.getActiveColumnRoundedWidth(highestViewportStartColumnIndex);
                while (highestViewportStartColumnLeft > highestViewportStart) {
                    nextColumnLeft = highestViewportStartColumnLeft;
                    highestViewportStartColumnIndex--;
                    highestViewportStartColumnLeft = nextColumnLeft - (this._columnsManager.getActiveColumnRoundedWidth(highestViewportStartColumnIndex) + verticalGridLinesWidth);
                }
                anchorIndex = highestViewportStartColumnIndex;
                anchorOffset = highestViewportStart - highestViewportStartColumnLeft;
                if (!this._gridSettings.scrollHorizontallySmoothly) {
                    // Since we cannot show a partial column on left, this may prevent rightmost columns from being displayed in viewport
                    // Extend scrollable size (content size) so that the subsequent column can be shown on start when viewport is at end of content.
                    scrollSize += (nextColumnLeft - highestViewportStart);
                    if (anchorOffset !== 0) {
                        anchorOffset = 0;
                        if (anchorIndex < columnCount - 1) {
                            anchorIndex++;
                        }
                    }
                }

                return {
                    scrollSize,
                    anchor: {
                        index: anchorIndex,
                        offset: anchorOffset,
                    },
                };
            }
        }
    }

    private calculateRightAlignedGridLeftAnchorLimit(scrollStart: number, viewportSize: number): RevScrollDimension.ScrollSizeAndAnchor {
        const gridSettings = this._gridSettings;
        const fixedColumnCount = gridSettings.fixedColumnCount;
        const columnCount = this._columnsManager.activeColumnCount;
        if (columnCount <= fixedColumnCount) {
            return {
                anchor: RevScrollDimension.invalidAnchor,
                scrollSize: 0,
            }
        } else {
            let scrollSize = this.calculateActiveNonFixedColumnsWidth();
            if (scrollSize === 0) {
                return {
                    anchor: RevScrollDimension.invalidAnchor,
                    scrollSize: 0,
                }
            } else {
                const verticalGridLinesWidth = gridSettings.verticalGridLinesWidth;
                const scrollAfter = scrollStart + scrollSize;

                let anchorIndex: number;
                let anchorOffset: number;
                let prevColumnGridLineFinish = scrollStart - 1;
                let lowestViewportFinish = prevColumnGridLineFinish + viewportSize;
                if (lowestViewportFinish >= scrollAfter) {
                    lowestViewportFinish = scrollAfter - 1;
                }
                let lowestViewportStartColumnIndex = fixedColumnCount;
                let lowestViewportStartColumnFinish = prevColumnGridLineFinish + this._columnsManager.getActiveColumnRoundedWidth(lowestViewportStartColumnIndex);
                while (lowestViewportStartColumnFinish <= lowestViewportFinish) {
                    prevColumnGridLineFinish = lowestViewportStartColumnFinish;
                    lowestViewportStartColumnIndex++;
                    lowestViewportStartColumnFinish = prevColumnGridLineFinish + (this._columnsManager.getActiveColumnRoundedWidth(lowestViewportStartColumnIndex) + verticalGridLinesWidth);
                }
                anchorIndex = lowestViewportStartColumnIndex;
                anchorOffset = lowestViewportStartColumnFinish - lowestViewportFinish;
                if (!this._gridSettings.scrollHorizontallySmoothly) {
                    // Since we cannot show a partial column on right, this may prevent leftmost columns from being displayed in viewport
                    // Extend scrollable size (content size) so that the previous column can be shown on end when viewport is at start of content.
                    scrollSize += (lowestViewportFinish - prevColumnGridLineFinish);
                    if (anchorOffset !== 0) {
                        anchorOffset = 0;
                        if (anchorIndex > fixedColumnCount) {
                            anchorIndex--;
                        }
                    }
                }

                return {
                    scrollSize,
                    anchor: {
                        index: anchorIndex,
                        offset: anchorOffset,
                    },
                };
            }
        }
    }

    private calculateActiveNonFixedColumnsWidth() {
        const gridLinesVWidth = this._gridSettings.verticalGridLinesWidth;
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

    private calculateScrollAnchorFromViewportStart(viewportStart: number): RevScrollDimension.Anchor {
        this.ensureComputedOutsideAnimationFrame();

        viewportStart = Math.round(viewportStart);

        // viewportFinish: number, _start: number, contentFinish: number
        const scrollableStart = this.start;
        const columnCount = this._columnsManager.activeColumnCount;
        const fixedColumnCount = this._columnsManager.getFixedColumnCount();
        const gridProps = this._gridSettings;
        const gridLinesVWidth = gridProps.verticalGridLinesWidth;
        const gridRightAligned = gridProps.gridRightAligned;
        const scrollHorizontallySmoothly = gridProps.scrollHorizontallySmoothly;

        if (gridRightAligned) {
            const viewportSize = this.viewportSize;
            const scrollableAfter = scrollableStart + this.size;
            let limitedViewportAfter = viewportStart + viewportSize;
            if (limitedViewportAfter >= scrollableAfter) {
                limitedViewportAfter = scrollableAfter;
            }
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
                    if (limitedViewportAfter <= columnLeft) {
                        prevColumnLeft = columnLeft;
                    } else {
                        let offset: number;
                        if (!scrollHorizontallySmoothly) {
                            offset = 0;
                        } else {
                            const columnAfter = columnLeft + width;
                            offset = columnAfter - limitedViewportAfter;
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

    /** @internal */
    private calculateScrollableViewLeftUsingDimensionStart(columnScrollAnchorIndex: number, columnScrollAnchorOffset: number) {
        const dimensionStart = this.start;
        const gridLinesVWidth = this._gridSettings.verticalGridLinesWidth;
        const columnCount = this._columnsManager.activeColumnCount;
        const fixedColumnCount = this._columnsManager.getFixedColumnCount();
        let result = dimensionStart;
        for (let i = fixedColumnCount; i < columnCount; i++) {
            if (i === columnScrollAnchorIndex) {
                break;
            } else {
                result += (this._columnsManager.getActiveColumnRoundedWidth(i) + gridLinesVWidth);
            }
        }

        result += columnScrollAnchorOffset;

        return result;
    }

    /** @internal */
    private calculateScrollableViewRightUsingDimensionFinish(columnScrollAnchorIndex: number, columnScrollAnchorOffset: number) {
        const dimensionFinish = this.finish;

        const gridLinesVWidth = this._gridSettings.verticalGridLinesWidth;
        const columnCount = this._columnsManager.activeColumnCount;
        const fixedColumnCount = this._columnsManager.getFixedColumnCount();
        let result = dimensionFinish;
        for (let i = columnCount - 1; i > fixedColumnCount; i--) {
            if (i === columnScrollAnchorIndex) {
                break;
            } else {
                result -= this._columnsManager.getActiveColumnRoundedWidth(i);
            }
        }

        if (gridLinesVWidth > 0) {
            const anchorColumnCount = columnCount - columnScrollAnchorIndex;
            if (anchorColumnCount > 1) {
                result -= (anchorColumnCount - 1) * gridLinesVWidth;
            }
        }

        result -= columnScrollAnchorOffset;

        return result;
    }
}
