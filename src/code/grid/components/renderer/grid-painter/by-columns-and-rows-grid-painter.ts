
import { GridSettings } from '../../../interfaces/grid-settings';
import { CanvasEx } from '../../canvas-ex/canvas-ex';
import { CanvasRenderingContext2DEx } from '../../canvas-ex/canvas-rendering-context-2d-ex';
import { Focus } from '../../focus/focus';
import { Mouse } from '../../mouse/mouse';
import { Selection } from '../../selection/selection';
import { SubgridsManager } from '../../subgrid/subgrids-manager';
import { ViewLayout } from '../../view/view-layout';
import { GridPainter } from './grid-painter';

/** @summary Render the grid with consolidated row OR column rects.
 * @desc Paints all the cells of a grid, one column at a time.
 *
 * First, a background rect is drawn using the grid background color.
 *
 * Then, if there are any rows with their own background color _that differs from the grid background color,_ these are consolidated and the consolidated groups of row backgrounds are all drawn before iterating through cells. These row backgrounds get priority over column backgrounds.
 *
 * If there are no such row background rects to draw, the column rects are consolidated and drawn instead (again, before the cells). Note that these column rects are _not_ suitable for clipping overflow text from previous columns. If you have overflow text, either turn on clipping (big performance hit) or turn on one of the `truncateTextWithEllipsis` options.
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by setting {@link CellEvent#reset|reset} on each.
 *
 * See also the discussion of clipping in {@link ViewLayout#paintCellsByColumns|paintCellsByColumns}.
 */
export class ByColumnsAndRowsGridPainter extends GridPainter {
    constructor(
        gridProperties: GridSettings,
        canvasEx: CanvasEx,
        subgridsManager: SubgridsManager,
        viewLayout: ViewLayout,
        focus: Focus,
        selection: Selection,
        mouse: Mouse,
        repaintAllRequiredEventer: GridPainter.RepaintAllRequiredEventer,
    ) {
        super(
            gridProperties,
            canvasEx,
            subgridsManager,
            viewLayout,
            focus,
            selection,
            mouse,
            repaintAllRequiredEventer,
            ByColumnsAndRowsGridPainter.key,
            false,
            ByColumnsAndRowsGridPainter.initialRebundle
        );
    }

    paintCells(gc: CanvasRenderingContext2DEx) {
        const gridProps = this.gridSettings;
        const viewLayoutColumns = this.viewLayout.columns;
        const columnCount = viewLayoutColumns.length;
        const viewLayoutRows = this.viewLayout.rows;
        const rowCount = viewLayoutRows.length;
        if (columnCount > 0 && rowCount > 0) {
            const lastColumnIndex = columnCount - 1;
            const pool = this.viewLayout.getColumnRowOrderedCellPool(); // must match algorithm below
            // clipToGrid,
            let firstVisibleColumnLeft: number;
            let lastVisibleColumnRightPlus1: number;
            if (columnCount === 0) {
                firstVisibleColumnLeft = 0;
                lastVisibleColumnRightPlus1 = 0;
            } else {
                firstVisibleColumnLeft = viewLayoutColumns[0].left;
                lastVisibleColumnRightPlus1 = viewLayoutColumns[lastColumnIndex].rightPlus1;
            }
            const viewWidth = lastVisibleColumnRightPlus1 - firstVisibleColumnLeft;
            const viewHeight = viewLayoutRows[rowCount - 1].bottom;

            const canvasBounds = this.canvasEx.bounds;
            gc.clearRect(0, 0, canvasBounds.width, canvasBounds.height);

            if (!columnCount || !rowCount) { return; }

            const gridPrefillColor = gridProps.backgroundColor;
            if (gc.alpha(gridPrefillColor) > 0) {
                gc.cache.fillStyle = gridPrefillColor;
                gc.fillRect(firstVisibleColumnLeft, 0, viewWidth, viewHeight);
            }

            let rowPrefillColors: string[] | undefined;
            const rowBundlesAndPrefillColors = this.getRowBundlesAndPrefillColors(viewLayoutRows);
            if (rowBundlesAndPrefillColors === undefined) {
                const columnBundles = this.getColumnBundles(viewLayoutColumns);
                const columnBundleCount = columnBundles.length;
                for (let i = columnBundleCount - 1; i > 0; i--) {
                    const columnBundle = columnBundles[i];
                    if (columnBundle !== undefined) {
                        gc.clearFill(columnBundle.left, 0, columnBundle.right - columnBundle.left, viewHeight, columnBundle.backgroundColor);
                    }
                }
                rowPrefillColors = undefined;
            } else {
                const rowBundles = rowBundlesAndPrefillColors.bundles;
                for (let i = rowBundles.length - 1; i >= 0; i--) {
                    const rowBundle = rowBundles[i];
                    gc.clearFill(firstVisibleColumnLeft, rowBundle.top, viewWidth, rowBundle.bottom - rowBundle.top, rowBundle.backgroundColor);
                }
                rowPrefillColors = rowBundlesAndPrefillColors.prefillColors;
            }

            // gc.clipSave(clipToGrid, firstVisibleColumnLeft, 0, lastVisibleColumnRight, viewHeight);

            // For each column...
            let cellEvent = 0;
            for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                const vc = viewLayoutColumns[columnIndex];

                // Optionally clip to visible portion of column to prevent text from overflowing to right.
                const columnClip = vc.column.settings.columnClip;
                gc.clipSave(columnClip ?? columnIndex === lastColumnIndex, 0, 0, vc.rightPlus1, viewHeight);

                let preferredWidth: number | undefined;
                // For each row of each subgrid (of each column)...
                for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                    // if (!pool[p].disabled) {
                        const prefillColor = rowPrefillColors === undefined ? vc.column.settings.backgroundColor : rowPrefillColors[rowIndex];

                        const viewCell = pool[cellEvent++];

                        try {
                            const paintWidth = this.paintCell(gc, viewCell, prefillColor);
                            if (paintWidth !== undefined) {
                                if (preferredWidth === undefined) {
                                    preferredWidth = paintWidth;
                                } else {
                                    preferredWidth = Math.max(preferredWidth, paintWidth);
                                }
                            }
                        } catch (e) {
                            this.paintErrorCell(e as Error, gc, vc, viewCell.visibleRow);
                        }
                    // }
                }

                gc.clipRestore();

                if (preferredWidth !== undefined) {
                    vc.column.settings.preferredWidth = Math.ceil(preferredWidth);
                }
            }

            // gc.clipRestore(clipToGrid);
        }
    }
}

export namespace ByColumnsAndRowsGridPainter {
    export const key = 'by-columns-and-rows';
    export const initialRebundle = true; // see rebundleGridRenderers
}
