import { GridSettings } from '../../../interfaces/grid-settings';
import { CanvasEx } from '../../canvas-ex/canvas-ex';
import { CanvasRenderingContext2DEx } from '../../canvas-ex/canvas-rendering-context-2d-ex';
import { Focus } from '../../focus/focus';
import { Mouse } from '../../mouse/mouse';
import { Selection } from '../../selection/selection';
import { SubgridsManager } from '../../subgrid/subgrids-manager';
import { ViewLayout } from '../../view/view-layout';
import { GridPainter } from './grid-painter';

/** @summary Render the grid with discrete column rects.
 * @desc Paints all the cells of a grid, one column at a time.
 *
 * In this grid renderer, a background rect is _not_ drawn using the grid background color.
 *
 * Rather, all columns paint their own background rects, with color defaulting to grid background color.
 *
 * The idea of painting each column rect is to "clip" text that might have overflowed from the previous column by painting over it with the background from this column. Only the last column will show overflowing text, and only if the canvas width exceeds the grid width. If this is the case, you can turn on clipping for the last column only by setting `columnClip` to `true` for the last column.
 *
 * NOTE: As a convenience feature, setting `columnClip` to `null` will clip only the last column, so simply setting it on the grid (rather than the last column) will have the same effect. This is much more convenient because you don't have to worry about the last column being redefined (moved, hidden, etc).
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by setting {@link CellEvent#reset|reset} on each.
 *
 * See also the discussion of clipping in {@link ViewLayout#paintCellsByColumnsDiscrete|paintCellsByColumnsDiscrete}.
 */

export class ByColumnsDiscreteGridPainter extends GridPainter {
    constructor(
        gridProperties: GridSettings,
        mouse: Mouse,
        canvasEx: CanvasEx,
        subgridsManager: SubgridsManager,
        viewLayout: ViewLayout,
        focus: Focus,
        selection: Selection,
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
            repaintAllRequiredEventer,
            ByColumnsDiscreteGridPainter.key,
            false,
            undefined
        );
    }

    paintCells(gc: CanvasRenderingContext2DEx) {
        const viewLayoutColumns = this.viewLayout.columns;
        const columnCount = viewLayoutColumns.length;
        const viewLayoutRows = this.viewLayout.rows;
        const rowCount = viewLayoutRows.length;
        const lastColumnIndex = columnCount - 1;
        const pool = this.viewLayout.getColumnRowOrderedCellPool(); // must match algorithm below
        // clipToGrid;
        // let firstVisibleColumnLeft: number;
        // let lastVisibleColumnRight: number;
        // if (C === 0) {
        //     firstVisibleColumnLeft = 0;
        //     lastVisibleColumnRight = 0;
        // } else {
        //     firstVisibleColumnLeft = this.visibleColumns[0].left;
        //     lastVisibleColumnRight = this.visibleColumns[cLast].right;
        // }
        const viewHeight = rowCount ? viewLayoutRows[rowCount - 1].bottom : 0;

        const canvasBounds = this.canvasEx.bounds;
        gc.clearRect(0, 0, canvasBounds.width, canvasBounds.height);

        if (!columnCount || !rowCount) { return; }

        // if (this.reset) {
        //     this.resetAllGridPaintersRequiredEventer(['by-columns']);
        //     this.reset = false;
        //     this.bundleColumns(true);
        // }

        // gc.clipSave(clipToGrid, firstVisibleColumnLeft, 0, lastVisibleColumnRight, viewHeight);

        // For each column...
        let cellIndex = 0;
        for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
            const vc = viewLayoutColumns[columnIndex];

            const prefillColor = vc.column.settings.backgroundColor;
            gc.clearFill(vc.left, 0, vc.width, viewHeight, prefillColor);

            // Optionally clip to visible portion of column to prevent text from overflowing to right.
            const columnClip = vc.column.settings.columnClip;
            gc.clipSave(columnClip ?? columnIndex === lastColumnIndex, 0, 0, vc.rightPlus1, viewHeight);

            let preferredWidth: number | undefined;
            // For each row of each subgrid (of each column)...
            for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                const viewCell = pool[cellIndex++]; // next cell down the column (make sure the correct pool is used above)

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
            }

            gc.clipRestore();

            if (preferredWidth !== undefined) {
                vc.column.settings.preferredWidth = Math.ceil(preferredWidth);
            }
        }

        // gc.clipRestore(clipToGrid);
    }
}

export namespace ByColumnsDiscreteGridPainter {
    export const key = 'by-columns-discrete';
}