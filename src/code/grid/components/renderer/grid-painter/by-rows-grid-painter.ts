
import { GridSettings } from '../../../interfaces/grid-settings';
import { CanvasEx } from '../../canvas-ex/canvas-ex';
import { CanvasRenderingContext2DEx } from '../../canvas-ex/canvas-rendering-context-2d-ex';
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
export class ByRowsGridPainter extends GridPainter {
    constructor(
        gridProperties: GridSettings,
        mouse: Mouse,
        canvasEx: CanvasEx,
        subgridsManager: SubgridsManager,
        viewLayout: ViewLayout,
        focus: Focus,
        selection: Selection,
        resetAllGridPaintersRequiredEventer: GridPainter.ResetAllGridPaintersRequiredEventer,
        repaintAllRequiredEventer: GridPainter.RepaintAllRequiredEventer,
    ) {
        super(
            gridProperties,
            mouse,
            canvasEx,
            subgridsManager,
            viewLayout,
            focus,
            selection,
            resetAllGridPaintersRequiredEventer,
            repaintAllRequiredEventer,
            ByRowsGridPainter.key,
            false,
            undefined
        );
    }

    paintCells(gc: CanvasRenderingContext2DEx) {
        const gridProps = this.gridProperties;
        const gridPrefillColor = gridProps.backgroundColor;
        const rowBundles = this.rowBundles;
        const visibleColumns = this.viewLayoutColumns;
        const visibleRows = this.viewLayoutRows;
        const C = visibleColumns.length;
        const c0 = 0;
        const cLast = C - 1;
        const R = visibleRows.length;
        const pool = this.viewCellPool;
        const preferredWidths = new Array<number | undefined>(C - c0);
        // columnClip,
        // clipToGrid,
        let firstVisibleColumnLeft: number;
        let lastVisibleColumnRight: number;
        if (C === 0) {
            firstVisibleColumnLeft = 0;
            lastVisibleColumnRight = 0;
        } else {
            firstVisibleColumnLeft = this.viewLayoutColumns[0].left;
            lastVisibleColumnRight = this.viewLayoutColumns[cLast].rightPlus1;
        }
        const viewWidth = lastVisibleColumnRight - firstVisibleColumnLeft;
        const viewHeight = R ? visibleRows[R - 1].bottom : 0;
        const drawLines = gridProps.gridLinesH;
        const lineWidth = gridProps.gridLinesHWidth;
        const lineColor = gridProps.gridLinesHColor;

        const canvasBounds = this.canvasEx.bounds;
        gc.clearRect(0, 0, canvasBounds.width, canvasBounds.height);

        if (!C || !R) { return; }

        if (gc.alpha(gridPrefillColor) > 0) {
            gc.cache.fillStyle = gridPrefillColor;
            gc.fillRect(firstVisibleColumnLeft, 0, viewWidth, viewHeight);
        }

        if (this.reset) {
            this.resetAllGridPaintersRequiredEventer([]);
            this.reset = false;
            this.bundleRows(true);
        }

        const rowPrefillColors = this.rowPrefillColors;

        for (let r = rowBundles.length; r--;) {
            const rowBundle = rowBundles[r];
            gc.clearFill(firstVisibleColumnLeft, rowBundle.top, viewWidth, rowBundle.bottom - rowBundle.top, rowBundle.backgroundColor);
        }

        // gc.clipSave(clipToGrid, firstVisibleColumnLeft, 0, lastVisibleColumnRight, viewHeight);

        // For each row of each subgrid...
        for (let p = 0, r = 0; r < R; r++) {
            const prefillColor = rowPrefillColors[r];

            const visibleRow = visibleRows[r];

            if (drawLines) {
                gc.cache.fillStyle = lineColor;
                gc.fillRect(firstVisibleColumnLeft, visibleRow.bottom, viewWidth, lineWidth);
            }

            // For each column (of each row)...
            visibleColumns.forEach((vc, c) => {  // eslint-disable-line no-loop-func
                p++;
                const viewCell = pool[p]; // next cell across the row (redundant for first cell in row)
                vc = viewCell.visibleColumn;

                // Optionally clip to visible portion of column to prevent text from overflowing to right.
                const columnClip = vc.column.settings.columnClip;
                gc.clipSave(columnClip ?? c === cLast, 0, 0, vc.rightPlus1, viewHeight);

                try {
                    const paintWidth = this.paintCell(gc, viewCell, prefillColor);
                    if (paintWidth !== undefined) {
                        const previousColumnPreferredWidth = preferredWidths[c];
                        if (previousColumnPreferredWidth === undefined) {
                            preferredWidths[c] = paintWidth;
                        } else {
                            preferredWidths[c] = Math.max(previousColumnPreferredWidth, paintWidth);
                        }
                    }
                } catch (e) {
                    this.paintErrorCell(e as Error, gc, vc, visibleRows[r]);
                }

                gc.clipRestore();
            });
        }

        // gc.clipRestore(clipToGrid);

        this.viewLayoutColumns.forEach((vc, c) => {
            const preferredWidth = preferredWidths[c];
            if (preferredWidth !== undefined) {
                vc.column.settings.preferredWidth = Math.round(preferredWidth);
            }
        });
    }
}

export namespace ByRowsGridPainter {
    export const key = 'by-rows';
}
