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
        if (index < this.startScrollAnchorLimitIndex) {
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
        const mainSubgrid = this._subgridsManager.mainSubgrid;
        const scrollableHeight = this.getVisibleScrollHeight();

        let start: number | undefined;
        let size: number | undefined;
        let viewportSize: number | undefined;
        let overflowed: boolean | undefined;
        let anchorLimits: ScrollDimension.ScrollAnchorLimits;

        if (scrollableHeight <= 0) {
            start = undefined;
            size = undefined;
            viewportSize = undefined;
            overflowed = undefined
            anchorLimits = {
                startAnchorLimitIndex: fixedRowCount,
                startAnchorLimitOffset: 0,
                finishAnchorLimitIndex: fixedRowCount,
                finishAnchorLimitOffset: 0,
            }

        } else {
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
                viewportSize = scrollableHeight / mainRowHeight;
                overflowed = viewportSize < size;

                anchorLimits = {
                    startAnchorLimitIndex: fixedRowCount,
                    startAnchorLimitOffset: 0,
                    finishAnchorLimitIndex: size - 1,
                    finishAnchorLimitOffset: 0,
                }
            }
        }
        // Viewport size and overflowed cannot currently be calculated.  Set to -1 and undefined
        this.setDimensionValues(start, size, viewportSize, overflowed, anchorLimits);
    }

    private getVisibleScrollHeight() {
        const footerHeight = this._subgridsManager.calculateFooterHeight();
        return this._canvasEx.height - footerHeight - this.getHeaderPlusFixedRowsHeight();
    }

    /**
     * @summary The total height of the "fixed rows."
     * @desc The total height of all (non-scrollable) rows preceding the (scrollable) data subgrid.
     * @return The height in pixels of the fixed rows area of the hypergrid, the total height of:
     * 1. All rows of all subgrids preceding the data subgrid.
     * 2. The first `fixedRowCount` rows of the data subgrid.
     */
    private getHeaderPlusFixedRowsHeight(): number {
        const subgrids = this._subgridsManager.subgrids;
        const gridSettings = this._gridSettings;
        const gridLinesHWidth = gridSettings.gridLinesHWidth;
        let isMain = false;
        let height = 0;

        for (let i = 0; i < subgrids.length && !isMain; ++i) {
            const subgrid = subgrids[i];
            isMain = subgrid.isMain;
            const headerRowCount = isMain ? gridSettings.fixedRowCount : subgrid.getRowCount();
            for (let rowIndex = 0; rowIndex < headerRowCount; ++rowIndex) {
                height += subgrid.getRowHeight(rowIndex);
                height += gridLinesHWidth;
            }
            // add in fixed rule thickness excess
            if (isMain && gridSettings.fixedLinesHWidth) {
                height += gridSettings.fixedLinesHWidth - gridLinesHWidth;
            }
        }

        return height;
    }

}

