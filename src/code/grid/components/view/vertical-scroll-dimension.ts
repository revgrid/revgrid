import { SchemaServer } from '../../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { AssertError } from '../../types-utils/revgrid-error';
import { HorizontalVertical } from '../../types-utils/types';
import { CanvasManager } from '../canvas/canvas-manager';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { ScrollDimension } from './scroll-dimension';

export class VerticalScrollDimension<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaServer.Field> extends ScrollDimension<BGS> {
    constructor(
        private readonly _gridSettings: BGS,
        canvasManager: CanvasManager<BGS>,
        private readonly _subgridsManager: SubgridsManager<BGS, BCS, SF>,
    ) {
        super(
            HorizontalVertical.Vertical,
            canvasManager,
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
        const scrollableHeight = this._canvasEx.flooredContainerHeight - (preMainPlusFixedRowsHeight + postMainHeight);

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
                const subgridRowCount = mainSubgrid.getRowCount();
                start = fixedRowCount;
                size = subgridRowCount - start;
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
                let finishAnchorLimitIndex: number;
                if (overflowed) {
                    finishAnchorLimitIndex = size - viewportSize;
                } else {
                    finishAnchorLimitIndex = subgridRowCount - 1;
                }

                anchorLimits = {
                    startAnchorLimitIndex: fixedRowCount,
                    startAnchorLimitOffset: 0,
                    finishAnchorLimitIndex,
                    finishAnchorLimitOffset: 0,
                }
            }
        }
        // Viewport size and overflowed cannot currently be calculated.  Set to -1 and undefined
        this.setDimensionValues(start, size, viewportSize, viewportSizeExact, overflowed, anchorLimits);
    }
}

