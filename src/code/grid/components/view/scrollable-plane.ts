import { GridSettings } from '../../interfaces/grid-settings';
import { ScrollDimensionMonitor } from '../../lib/scroll-dimension-monitor';
import { ColumnsManager } from '../column/columns-manager';

export class ScrollablePlane {
    readonly horizontalDimension: ScrollablePlane.HorizontalDimension;
    readonly verticalDimension: ScrollablePlane.VerticalDimension;

    constructor(
        gridProperties: GridSettings,
        columnsManager: ColumnsManager,
    ) {
        this.horizontalDimension = new ScrollablePlane.HorizontalDimension(gridProperties, columnsManager);
        this.verticalDimension = new ScrollablePlane.VerticalDimension();
    }
}

export namespace ScrollablePlane {
    export interface Anchor {
        index: number; // Index of column/row
        offset: number; // number of pixels anchor is offset in current column/row
    }

    export class Dimension implements ScrollDimensionMonitor {
        startSizeChangedEventer: ScrollDimensionMonitor.DimensionChangedEventer;
        viewportStartChangedEventer: ScrollDimensionMonitor.ViewportStartChangedEventer;

        private _start: number;
        private _size: number;
        private _viewportStart: number;
        private _viewportSize: number;

        get start() { return this._start; }
        get size() { return this._size; }
        get viewportStart() { return this._viewportStart; }
        get viewportSize() { return this._viewportSize; }

        protected setStartSize(start: number, size: number) {
            let changed = false;
            if (start !== this._start) {
                this._start = start;
                changed = true;
            }
            if (size !== this._size) {
                this._size = size;
                changed = true;
            }
            if (changed) {
                this.startSizeChangedEventer();
            }
        }

        protected setViewportStart(value: number) {
            if (value !== this._viewportStart) {
                this._viewportStart = value;
                this.viewportStartChangedEventer();
            }
        }
    }

    export class HorizontalDimension extends Dimension {
        private _startScrollAnchorLimitIndex: number;
        private _startScrollAnchorLimitOffset: number;
        private _finishScrollAnchorLimitIndex: number;
        private _finishScrollAnchorLimitOffset: number;

        constructor(
            private readonly _gridProperties: GridSettings,
            private readonly _columnsManager: ColumnsManager,
        ) {
            super();
        }

        calculateColumnScrollAnchor(viewportStart: number, viewportFinish: number, contentStart: number, contentFinish: number): ScrollablePlane.Anchor {
            const columnCount = this._columnsManager.activeColumnCount;
            const fixedColumnCount = this._columnsManager.getFixedColumnCount();
            const gridProps = this._gridProperties;
            const gridLinesVWidth = gridProps.gridLinesVWidth;
            const gridRightAligned = gridProps.gridRightAligned;
            const scrollHorizontallySmoothly = gridProps.scrollHorizontallySmoothly;

            if (gridRightAligned) {
                if (viewportFinish >= contentFinish) {
                    return {
                        index: columnCount - 1,
                        offset: 0
                    };
                } else {
                    let prevColumnLeft = contentFinish;
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
                let left = contentStart;
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
        calculateColumnScrollAnchorToScrollIntoView(activeColumnIndex: number, gridRightAligned: boolean, viewportSize: number): ScrollablePlane.Anchor {
            const gridProperties = this._gridProperties;
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
                const viewportFinishPlus1 = left + viewportSize;
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
                const viewportStart = rightPlus1 - viewportSize;
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

    }

    export class VerticalDimension extends Dimension {

    }
}
