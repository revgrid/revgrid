import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { GridSettings } from '../../interfaces/settings/grid-settings';
import { AssertError } from '../../types-utils/revgrid-error';
import { Canvas } from '../canvas/canvas';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { ScrollDimension } from './scroll-dimension';

export class VerticalScrollDimension<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> extends ScrollDimension<BGS> {
    constructor(
        gridSettings: GridSettings,
        canvas: Canvas<BGS>,
        private readonly _subgridsManager: SubgridsManager<BCS, SF>,
    ) {
        super(
            ScrollDimension.AxisEnum.vertical,
            gridSettings,
            canvas,
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
        let viewportCoverageExtent: ScrollDimension.ViewportCoverageExtent;

        let startAnchorLimit: ScrollDimension.Anchor;
        let finishAnchorLimit: ScrollDimension.Anchor;
        if (scrollSize <= 0) {
            startAnchorLimit = ScrollDimension.invalidAnchor;
            finishAnchorLimit = ScrollDimension.invalidAnchor;
            viewportSize = 0;
            viewportSizeExactMultiple = false;
            viewportCoverageExtent = ScrollDimension.ViewportCoverageExtent.None;
        } else {
            let possibleFractionalViewportSize: number;

            startAnchorLimit = {
                index: fixedRowCount,
                offset: 0,
            };

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
                const scrollableHeight = this._canvas.flooredHeight - (preMainPlusFixedHeight + postMainHeight);
                // Rearrangement of scrollableHeight = (viewportSize - 1) * (mainRowHeight + gridLinesHWidth) + mainRowHeight
                possibleFractionalViewportSize = (scrollableHeight - mainRowHeight) / (mainRowHeight + gridLinesHWidth) + 1;
                viewportSize = Math.floor(possibleFractionalViewportSize);
                viewportSizeExactMultiple = possibleFractionalViewportSize === viewportSize;
            }

            let finishAnchorLimitIndex: number;
            if (possibleFractionalViewportSize <= 0) {
                viewportCoverageExtent = ScrollDimension.ViewportCoverageExtent.None;
                finishAnchorLimitIndex = fixedRowCount + scrollSize;
            } else {
                if (viewportSize < scrollSize) {
                    viewportCoverageExtent = ScrollDimension.ViewportCoverageExtent.Partial;
                    finishAnchorLimitIndex = fixedRowCount + scrollSize - viewportSize;
                } else {
                    viewportCoverageExtent = ScrollDimension.ViewportCoverageExtent.Full;
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
