
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
 * See also the discussion of clipping in {@link Viewport#paintCellsByColumns|paintCellsByColumns}.
 */
export class ByColumnsAndRowsGridPainter extends GridPainter {
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
            ByColumnsAndRowsGridPainter.key,
            false,
            ByColumnsAndRowsGridPainter.initialRebundle
        );
    }

    paintCells(gc: CanvasRenderingContext2DEx) {
        const gridProps = this.gridProperties;
        let prefillColor: string;
        let rowPrefillColors: string[];
        const gridPrefillColor = gridProps.backgroundColor;
        const C = this.viewportColumns.length;
        const cLast = C - 1;
        const R = this.viewportRows.length;
        const pool = this.viewportCellPool;
        // clipToGrid,
        let firstVisibleColumnLeft: number;
        let lastVisibleColumnRightPlus1: number;
        if (C === 0) {
            firstVisibleColumnLeft = 0;
            lastVisibleColumnRightPlus1 = 0;
        } else {
            firstVisibleColumnLeft = this.viewportColumns[0].left;
            lastVisibleColumnRightPlus1 = this.viewportColumns[cLast].rightPlus1;
        }
        const viewWidth = lastVisibleColumnRightPlus1 - firstVisibleColumnLeft;
        const viewHeight = R ? this.viewportRows[R - 1].bottom : 0;

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
            this.bundleRows(false);
            this.bundleColumns(true);
        } else if (this.rebundle === true) {
            // do not do this if undefined
            this.rebundle = false;
            this.bundleColumns();
        }

        const rowBundles = this.rowBundles;
        if (rowBundles.length) {
            rowPrefillColors = this.rowPrefillColors;
            for (let r = rowBundles.length; r--;) {
                const rowBundle = rowBundles[r];
                gc.clearFill(firstVisibleColumnLeft, rowBundle.top, viewWidth, rowBundle.bottom - rowBundle.top, rowBundle.backgroundColor);
            }
        } else {
            const columnBundles = this.columnBundles;
            const columnBundleCount = columnBundles.length;
            for (let i = columnBundleCount - 1; i > 0; i--) {
                const columnBundle = columnBundles[i];
                if (columnBundle !== undefined) {
                    gc.clearFill(columnBundle.left, 0, columnBundle.right - columnBundle.left, viewHeight, columnBundle.backgroundColor);
                }
            }
        }

        // gc.clipSave(clipToGrid, firstVisibleColumnLeft, 0, lastVisibleColumnRight, viewHeight);

        // For each column...
        let p = 0;
        this.viewportColumns.forEach(
            (vc, c) => {
                const cellEvent = pool[p];
                vc = cellEvent.visibleColumn;

                if (!rowPrefillColors) {
                    prefillColor = vc.column.properties.backgroundColor;
                }

                // Optionally clip to visible portion of column to prevent text from overflowing to right.
                const columnClip = vc.column.properties.columnClip;
                gc.clipSave(columnClip ?? c === cLast, 0, 0, vc.rightPlus1, viewHeight);

                let preferredWidth: number | undefined;
                // For each row of each subgrid (of each column)...
                for (let r = 0; r < R; r++, p++) {
                    // if (!pool[p].disabled) {
                        if (rowPrefillColors) {
                            prefillColor = rowPrefillColors[r];
                        }

                        const viewportCell = pool[p];

                        try {
                            const paintWidth = this.paintCell(gc, viewportCell, prefillColor);
                            if (paintWidth !== undefined) {
                                if (preferredWidth === undefined) {
                                    preferredWidth = paintWidth;
                                } else {
                                    preferredWidth = Math.max(preferredWidth, paintWidth);
                                }
                            }
                        } catch (e) {
                            this.paintErrorCell(e as Error, gc, vc, pool[p].visibleRow);
                        }
                    // }
                }

                gc.clipRestore();

                if (preferredWidth !== undefined) {
                    vc.column.properties.preferredWidth = Math.ceil(preferredWidth);
                }
            }
        );

        // gc.clipRestore(clipToGrid);
    }
}

export namespace ByColumnsAndRowsGridPainter {
    export const key = 'by-columns-and-rows';
    export const initialRebundle = true; // see rebundleGridRenderers
}
