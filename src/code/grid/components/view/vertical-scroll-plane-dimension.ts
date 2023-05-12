import { GridSettings } from '../../interfaces/grid-settings';
import { CanvasEx } from '../canvas-ex/canvas-ex';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { ScrollPlaneDimension } from './scroll-plane-dimension';

export class VerticalScrollPlaneDimension extends ScrollPlaneDimension {
    constructor(
        canvasEx: CanvasEx,
        private readonly _gridSettings: GridSettings,
        private readonly _subgridsManager: SubgridsManager,
    ) {
        super(canvasEx);
    }

    protected override compute() {
        const mainSubgrid = this._subgridsManager.mainSubgrid;
        const subgridRowCount = mainSubgrid.getRowCount();
        const gridProps = this._gridSettings;
        const scrollableHeight = this.getVisibleScrollHeight();
        const lineGap = gridProps.gridLinesHWidth;
        let rowsHeight = 0;
        let lastPageRowCount = 0;

        while (lastPageRowCount < subgridRowCount && rowsHeight < scrollableHeight) {
            rowsHeight += mainSubgrid.getRowHeight(subgridRowCount - lastPageRowCount - 1) + lineGap;
            lastPageRowCount++;
        }
        if (rowsHeight > scrollableHeight) {
            lastPageRowCount--;
        }

        const finish = Math.max(0, subgridRowCount - gridProps.fixedRowCount - lastPageRowCount);
        const anchorLimits: ScrollPlaneDimension.ScrollAnchorLimits = {
            // not currently used so set to dummy values
            startAnchorLimitIndex: -1,
            startAnchorLimitOffset: -1,
            finishAnchorLimitIndex: -1,
            finishAnchorLimitOffset: -1,
        }
        // Viewport size and overflowed cannot currently be calculated.  Set to -1 and undefined
        this.setDimensionValues(0, finish + 1, -1, undefined, anchorLimits);
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
            const R = isMain ? gridSettings.fixedRowCount : subgrid.getRowCount();
            for (let r = 0; r < R; ++r) {
                height += subgrid.getRowHeight(r);
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

