
import { SchemaServer } from '../../../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../../interfaces/settings/behaviored-grid-settings';
import { CanvasManager } from '../../canvas/canvas-manager';
import { Focus } from '../../focus/focus';
import { Mouse } from '../../mouse/mouse';
import { Selection } from '../../selection/selection';
import { SubgridsManager } from '../../subgrid/subgrids-manager';
import { ViewLayout } from '../../view/view-layout';
import { GridPainter } from './grid-painter';

/** @summary Render the grid.
 * @desc _**NOTE:** This grid renderer is not as performant as the others and it's use is not recommended if you care about performance. The reasons for the wanting performance are unclear, possibly having to do with the way Chrome optimizes access to the column objects?_
 *
 * Paints all the cells of a grid, one row at a time.
 *
 * First, a background rect is drawn using the grid background color.
 *
 * Then, if there are any rows with their own background color _that differs from the grid background color,_ these are consolidated and the consolidated groups of row backgrounds are all drawn before iterating through cells.
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by setting {@link CellEvent#reset|reset} on each.
 *
 * See also the discussion of clipping in {@link ViewLayout#paintCellsByColumns|paintCellsByColumns}.
 */
export class ByRowsGridPainter<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SC extends SchemaServer.Column<BCS>> extends GridPainter<BGS, BCS, SC> {
    constructor(
        gridSettings: BGS,
        canvasManager: CanvasManager<BGS>,
        subgridsManager: SubgridsManager<BGS, BCS, SC>,
        viewLayout: ViewLayout<BGS, BCS, SC>,
        focus: Focus<BGS, BCS, SC>,
        selection: Selection<BGS, BCS, SC>,
        mouse: Mouse<BGS, BCS, SC>,
        repaintAllRequiredEventer: GridPainter.RepaintAllRequiredEventer,
    ) {
        super(
            gridSettings,
            canvasManager,
            subgridsManager,
            viewLayout,
            focus,
            selection,
            mouse,
            repaintAllRequiredEventer,
            ByRowsGridPainter.key,
            false,
            undefined
        );
    }

    paintCells() {
        const gc = this._renderingContext;
        const gridProps = this.gridSettings;
        const gridPrefillColor = gridProps.backgroundColor;
        const viewLayout = this.viewLayout;
        const viewLayoutColumns = viewLayout.columns;
        const columnCount = viewLayoutColumns.length;
        const viewLayoutRows = viewLayout.rows;
        const rowCount = viewLayoutRows.length;
        const lastColumnIndex = columnCount - 1;
        const pool = viewLayout.getRowColumnOrderedCellPool(); // must match algorithm below and computationInvalid above
        const maxPaintWidths = new Array<number | undefined>(columnCount);
        // columnClip,
        // clipToGrid,
        let firstVisibleColumnLeft: number;
        let lastVisibleColumnRight: number;
        if (columnCount === 0) {
            firstVisibleColumnLeft = 0;
            lastVisibleColumnRight = 0;
        } else {
            firstVisibleColumnLeft = viewLayoutColumns[0].left;
            lastVisibleColumnRight = viewLayoutColumns[lastColumnIndex].rightPlus1;
        }
        const viewWidth = lastVisibleColumnRight - firstVisibleColumnLeft;
        const viewHeight = rowCount ? viewLayoutRows[rowCount - 1].bottomPlus1 : 0;
        const drawLines = gridProps.gridLinesH;
        const lineWidth = gridProps.gridLinesHWidth;
        const lineColor = gridProps.gridLinesHColor;

        const canvasBounds = this.canvasManager.bounds;
        gc.clearRect(0, 0, canvasBounds.width, canvasBounds.height);

        if (!columnCount || !rowCount) { return; }

        if (gc.alpha(gridPrefillColor) > 0) {
            gc.cache.fillStyle = gridPrefillColor;
            gc.fillRect(firstVisibleColumnLeft, 0, viewWidth, viewHeight);
        }

        let rowPrefillColors: string[] | undefined;
        const rowBundlesAndPrefillColors = this.getRowBundlesAndPrefillColors(viewLayoutRows);
        if (rowBundlesAndPrefillColors) {
            const rowBundles = rowBundlesAndPrefillColors.bundles;
            for (let r = rowBundles.length; r--;) {
                const rowBundle = rowBundles[r];
                gc.clearFillRect(firstVisibleColumnLeft, rowBundle.top, viewWidth, rowBundle.bottom - rowBundle.top, rowBundle.backgroundColor);
            }
            rowPrefillColors = rowBundlesAndPrefillColors.prefillColors;
        } else {
            rowPrefillColors = undefined;
        }

        // gc.clipSave(clipToGrid, firstVisibleColumnLeft, 0, lastVisibleColumnRight, viewHeight);

        let cellIndex = 0;
        // For each row of each subgrid...
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            const prefillColor = rowPrefillColors === undefined ? gridProps.backgroundColor : rowPrefillColors[rowIndex];

            const vr = viewLayoutRows[rowIndex];

            if (drawLines) {
                gc.cache.fillStyle = lineColor;
                gc.fillRect(firstVisibleColumnLeft, vr.bottomPlus1, viewWidth, lineWidth);
            }

            // For each column (of each row)... (make sure correct pool is used)
            for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                const vc = viewLayoutColumns[columnIndex];
                const viewCell = pool[cellIndex++];

                // Optionally clip to visible portion of column to prevent text from overflowing to right.
                const columnClip = vc.column.settings.columnClip;
                gc.clipSave(columnClip ?? columnIndex === lastColumnIndex, 0, 0, vc.rightPlus1, viewHeight);

                try {
                    const paintWidth = this.paintCell(viewCell, prefillColor);
                    if (paintWidth !== undefined) {
                        const previousColumnMaxPaintWidth = maxPaintWidths[columnIndex];
                        if (previousColumnMaxPaintWidth === undefined) {
                            maxPaintWidths[columnIndex] = paintWidth;
                        } else {
                            maxPaintWidths[columnIndex] = Math.max(previousColumnMaxPaintWidth, paintWidth);
                        }
                    }
                } catch (e) {
                    this.paintErrorCell(e as Error, vc, viewLayoutRows[rowIndex]);
                }

                gc.clipRestore();
            }
        }

        // gc.clipRestore(clipToGrid);

        for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
            const vc = viewLayoutColumns[columnIndex];
            const maxPaintWidth = maxPaintWidths[columnIndex];
            if (maxPaintWidth !== undefined) {
                vc.column.maxPaintWidth = Math.ceil(maxPaintWidth);
            }
        }
    }
}

export namespace ByRowsGridPainter {
    export const key = 'by-rows';
}
