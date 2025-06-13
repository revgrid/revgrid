import { RevAssertError, RevSchemaField } from '../../../common/internal-api';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../../settings/internal-api';
import { RevCanvas } from '../canvas/canvas';
import { RevSubgridsManager } from '../subgrid/subgrids-manager';
import { RevScrollDimension } from './scroll-dimension';

export class RevVerticalScrollDimension<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevScrollDimension<BGS> {
    constructor(
        gridSettings: RevGridSettings,
        canvas: RevCanvas<BGS>,
        private readonly _subgridsManager: RevSubgridsManager<BCS, SF>,
    ) {
        super(
            RevScrollDimension.AxisId.vertical,
            gridSettings,
            canvas,
        );
    }

    override calculateLimitedScrollAnchor(index: number, _offset: number): RevScrollDimension.Anchor {
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

        // Do not include preMain subgrid row counts in start and finish Anchor limits. ViewLayout.computeVertical() works on a subgrid by subgrid basis
        // So when it handles main subgrid, it does not want to deal with info from other subgrids.
        // Calculations of Viewport Start elsewhere however need to make allowance for these prior rows.
        const gridSettings = this._gridSettings;
        const fixedRowCount = gridSettings.fixedRowCount;
        const mainSubgrid = this._subgridsManager.mainSubgrid;
        const { count: preMainPlusFixedRowCount, height: preMainPlusFixedHeight } = this._subgridsManager.calculatePreMainPlusFixedRowCountAndHeight();
        const postMainHeight = this._subgridsManager.calculatePostMainHeight();

        const subgridRowCount = mainSubgrid.getRowCount();
        const scrollSize = subgridRowCount - fixedRowCount;

        let viewportSize: number;
        let viewportSizeExactMultiple: boolean;
        let viewportCoverageExtent: RevScrollDimension.ViewportCoverageExtent;

        let startAnchorLimit: RevScrollDimension.Anchor;
        let finishAnchorLimit: RevScrollDimension.Anchor;
        if (scrollSize <= 0) {
            startAnchorLimit = RevScrollDimension.invalidAnchor;
            finishAnchorLimit = RevScrollDimension.invalidAnchor;
            viewportSize = 0;
            viewportSizeExactMultiple = false;
            viewportCoverageExtent = RevScrollDimension.ViewportCoverageExtent.None;
        } else {
            let possibleFractionalViewportSize: number;

            startAnchorLimit = {
                index: fixedRowCount,
                offset: 0,
            };

            if (mainSubgrid.rowHeightsCanDiffer) {
                throw new RevAssertError('VSDC07339', 'Differing row heights in MainSubgrid not yet implemented');
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
                const scrollableHeight = this._canvas.flooredHeight - (preMainPlusFixedHeight + postMainHeight);
                // Rearrangement of scrollableHeight = (viewportSize - 1) * (mainRowHeight + gridLinesHWidth) + mainRowHeight
                possibleFractionalViewportSize = (scrollableHeight - mainRowHeight) / (mainRowHeight + gridLinesHWidth) + 1;
                viewportSize = Math.floor(possibleFractionalViewportSize);
                viewportSizeExactMultiple = possibleFractionalViewportSize === viewportSize;
            }

            let finishAnchorLimitIndex: number;
            if (possibleFractionalViewportSize <= 0) {
                viewportCoverageExtent = RevScrollDimension.ViewportCoverageExtent.None;
                finishAnchorLimitIndex = fixedRowCount + scrollSize;
            } else {
                if (viewportSize < scrollSize) {
                    viewportCoverageExtent = RevScrollDimension.ViewportCoverageExtent.Partial;
                    finishAnchorLimitIndex = fixedRowCount + scrollSize - viewportSize;
                } else {
                    viewportCoverageExtent = RevScrollDimension.ViewportCoverageExtent.Full;
                    finishAnchorLimitIndex = fixedRowCount;
                }
            }

            finishAnchorLimit = {
                index: finishAnchorLimitIndex,
                offset: 0,
            }
        }

        this.setComputedValues(
            preMainPlusFixedRowCount,
            scrollSize,
            viewportSize,
            viewportSizeExactMultiple,
            viewportCoverageExtent,
            startAnchorLimit,
            finishAnchorLimit,
        );
    }
}
