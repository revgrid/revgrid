import { GridSettings } from '../../interfaces/grid-settings';
import { AssertError } from '../../lib/revgrid-error';
import { HorizontalVertical } from '../../lib/types';
import { CanvasEx } from '../canvas-ex/canvas-ex';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { ScrollDimension } from './scroll-dimension';

export class VerticalScrollDimension extends ScrollDimension {
    constructor(
        private readonly _gridSettings: GridSettings,
        canvasEx: CanvasEx,
        private readonly _subgridsManager: SubgridsManager,
    ) {
        super(
            HorizontalVertical.Vertical,
            canvasEx,
        );
    }

    calculateLimitedScrollAnchor(index: number, _offset: number): ScrollDimension.Anchor {
        const startScrollAnchorLimitIndex = this.startScrollAnchorLimitIndex;
        if (index < startScrollAnchorLimitIndex) {
            return {
                index: startScrollAnchorLimitIndex,
                offset: 0,
            };
        } else {
            const finishScrollAnchorLimitIndex = this.finishScrollAnchorLimitIndex;
            if (index > finishScrollAnchorLimitIndex) {
                return {
                    index: finishScrollAnchorLimitIndex,
                    offset: 0,
                };
            } else {
                return {
                    index,
                    offset: _offset,
                };
            }
        }
    }

    protected override compute() {
        // called within Animation Frame

        const gridSettings = this._gridSettings;
        const fixedRowCount = gridSettings.fixedRowCount;
        const preMainPlusFixedRowsHeight = this._subgridsManager.calculatePreMainPlusFixedRowsHeight();
        const postMainHeight = this._subgridsManager.calculatePostMainHeight();
        const scrollableHeight = this._canvasEx.height - (preMainPlusFixedRowsHeight + postMainHeight);

        let start: number | undefined;
        let size: number | undefined;
        let viewportSize: number | undefined;
        let viewportSizeExact: boolean;
        let overflowed: boolean | undefined;
        let anchorLimits: ScrollDimension.ScrollAnchorLimits;

        if (scrollableHeight <= 0) {
            start = undefined;
            size = undefined;
            viewportSize = undefined;
            viewportSizeExact = false;
            overflowed = undefined
            anchorLimits = {
                startAnchorLimitIndex: fixedRowCount,
                startAnchorLimitOffset: 0,
                finishAnchorLimitIndex: fixedRowCount,
                finishAnchorLimitOffset: 0,
            }

        } else {
            const mainSubgrid = this._subgridsManager.mainSubgrid;
            if (mainSubgrid.rowHeightsCanDiffer) {
                throw new AssertError('VSDC07339', 'Differing row heights in MainSubgrid not yet implemented');
                // const lineGap = gridSettings.gridLinesHWidth;
                // let rowsHeight = 0;
                // let lastPageRowCount = 0;
                        // while (lastPageRowCount < mainSubgridRowCount && rowsHeight < scrollableHeight) {
                //     rowsHeight += mainSubgrid.getRowHeight(mainSubgridRowCount - lastPageRowCount - 1) + lineGap;
                //     lastPageRowCount++;
                // }
                // if (rowsHeight > scrollableHeight) {
                //     lastPageRowCount--;
                // }

                // const finish = Math.max(0, mainSubgridRowCount - gridSettings.fixedRowCount - lastPageRowCount);
            } else {
                start = fixedRowCount;
                size = mainSubgrid.getRowCount() - start;
                const mainRowHeight = mainSubgrid.getDefaultRowHeight();
                const gridLinesHWidth = this._gridSettings.gridLinesHWidth;
                // Rearrangement of scrollableHeight = (viewportSize - 1) * (mainRowHeight + gridLinesHWidth) + mainRowHeight
                const possiblyFractionalViewportSize = (scrollableHeight - mainRowHeight) / (mainRowHeight + gridLinesHWidth) + 1;
                viewportSize = Math.floor(possiblyFractionalViewportSize);
                viewportSizeExact = viewportSize === possiblyFractionalViewportSize;
                overflowed = viewportSize < size;
                // overflowed = (viewportSize < size) || (viewportSize === size && !viewportSizeExact);
                // let finishAnchorLimitIndex = size - viewportSize;
                // if (!viewportSizeExact) {
                //     finishAnchorLimitIndex++;
                // }

                anchorLimits = {
                    startAnchorLimitIndex: fixedRowCount,
                    startAnchorLimitOffset: 0,
                    finishAnchorLimitIndex: size - viewportSize,
                    finishAnchorLimitOffset: 0,
                }
            }
        }
        // Viewport size and overflowed cannot currently be calculated.  Set to -1 and undefined
        this.setDimensionValues(start, size, viewportSize, viewportSizeExact, overflowed, anchorLimits);
    }
}

