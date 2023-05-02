
import { CanvasEx } from '../canvas/canvas-ex';
import { CanvasRenderingContext2DEx } from '../canvas/canvas-rendering-context-2d-ex';
import { Focus } from '../focus';
import { GridProperties } from '../grid-properties';
import { Renderer } from '../renderer/renderer';
import { Viewport } from '../renderer/viewport';
import { Selection } from '../selection/selection';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { Mouse } from '../user-interface-input/mouse';
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
 * See also the discussion of clipping in {@link Viewport#paintCellsByColumns|paintCellsByColumns}.
 */
export class ByRowsGridPainter extends GridPainter {
    constructor(
        gridProperties: GridProperties,
        mouse: Mouse,
        canvasEx: CanvasEx,
        subgridsManager: SubgridsManager,
        viewport: Viewport,
        focus: Focus,
        selection: Selection,
        renderer: Renderer
    ) {
        super(
            gridProperties,
            mouse,
            canvasEx,
            subgridsManager,
            viewport,
            focus,
            selection,
            renderer,
            ByRowsGridPainter.key,
            false,
            undefined
        );
    }

    paintCells(gc: CanvasRenderingContext2DEx) {
        const gridProps = this.gridProperties;
        const gridPrefillColor = gridProps.backgroundColor;
        const rowBundles = this.rowBundles;
        const visibleColumns = this.viewportColumns;
        const visibleRows = this.viewportRows;
        const C = visibleColumns.length;
        const c0 = 0;
        const cLast = C - 1;
        const R = visibleRows.length;
        const pool = this.viewportCellPool;
        const preferredWidths = new Array<number | undefined>(C - c0);
        // columnClip,
        // clipToGrid,
        let firstVisibleColumnLeft: number;
        let lastVisibleColumnRight: number;
        if (C === 0) {
            firstVisibleColumnLeft = 0;
            lastVisibleColumnRight = 0;
        } else {
            firstVisibleColumnLeft = this.viewportColumns[0].left;
            lastVisibleColumnRight = this.viewportColumns[cLast].rightPlus1;
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
            this.renderer.resetAllGridPainters();
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
                const viewportCell = pool[p]; // next cell across the row (redundant for first cell in row)
                vc = viewportCell.visibleColumn;

                // Optionally clip to visible portion of column to prevent text from overflowing to right.
                const columnClip = vc.column.properties.columnClip;
                gc.clipSave(columnClip ?? c === cLast, 0, 0, vc.rightPlus1, viewHeight);

                try {
                    const paintWidth = this.paintCell(gc, viewportCell, prefillColor);
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

        this.viewportColumns.forEach((vc, c) => {
            const preferredWidth = preferredWidths[c];
            if (preferredWidth !== undefined) {
                vc.column.properties.preferredWidth = Math.round(preferredWidth);
            }
        });
    }
}

export namespace ByRowsGridPainter {
    export const key = 'by-rows';
}
