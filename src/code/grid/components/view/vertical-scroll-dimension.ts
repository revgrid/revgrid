import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { AssertError } from '../../types-utils/revgrid-error';
import { CanvasManager } from '../canvas/canvas-manager';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { ScrollDimension } from './scroll-dimension';

export class VerticalScrollDimension<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> extends ScrollDimension<BGS> {
    constructor(
        gridSettings: GridSettings,
        canvasManager: CanvasManager<BGS>,
        private readonly _subgridsManager: SubgridsManager<BCS, SF>,
    ) {
        super(
            ScrollDimension.AxisEnum.vertical,
            gridSettings,
            canvasManager,
        );
    }

    override calculateLimitedScrollAnchor(index: number, _offset: number): ScrollDimension.Anchor {
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
        const mainSubgrid = this._subgridsManager.mainSubgrid;
        const preMainPlusFixedRowsHeight = this._subgridsManager.calculatePreMainPlusFixedRowsHeight();
        const postMainHeight = this._subgridsManager.calculatePostMainHeight();

        const subgridRowCount = mainSubgrid.getRowCount();
        const start = fixedRowCount;
        const size = subgridRowCount - start;

        let viewportSize = this._canvasManager.flooredHeight - (preMainPlusFixedRowsHeight + postMainHeight);
        let viewportSizeExactMultiple: boolean;
        let overflowed: boolean;

        if (viewportSize <= 0) {
            viewportSize = 0;
            viewportSizeExactMultiple = true;
            overflowed = size > 0;
            // anchorLimits = {
            //     startAnchorLimitIndex: fixedRowCount,
            //     startAnchorLimitOffset: 0,
            //     finishAnchorLimitIndex: fixedRowCount,
            //     finishAnchorLimitOffset: 0,
            // }

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
                const mainRowHeight = mainSubgrid.getDefaultRowHeight();
                const gridLinesHWidth = this._gridSettings.horizontalGridLinesWidth;
                // Rearrangement of scrollableHeight = (viewportSize - 1) * (mainRowHeight + gridLinesHWidth) + mainRowHeight
                const possiblyFractionalViewportSize = (viewportSize - mainRowHeight) / (mainRowHeight + gridLinesHWidth) + 1;
                viewportSize = Math.floor(possiblyFractionalViewportSize);
                viewportSizeExactMultiple = viewportSize === possiblyFractionalViewportSize;
                overflowed = viewportSize < size;
            }
        }

        let finishAnchorLimitIndex: number;
        if (overflowed) {
            finishAnchorLimitIndex = size - viewportSize;
        } else {
            finishAnchorLimitIndex = fixedRowCount;
        }

        const anchorLimits: ScrollDimension.ScrollAnchorLimits = {
            startAnchorLimitIndex: fixedRowCount,
            startAnchorLimitOffset: 0,
            finishAnchorLimitIndex,
            finishAnchorLimitOffset: 0,
        }
        this.setComputedValues(start, size, viewportSize, viewportSizeExactMultiple, overflowed, anchorLimits);
    }
}
