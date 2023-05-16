
import { GridSettings } from '../../../interfaces/grid-settings';
import { CanvasEx } from '../../canvas-ex/canvas-ex';
import { CanvasRenderingContext2DEx } from '../../canvas-ex/canvas-rendering-context-2d-ex';
import { Focus } from '../../focus/focus';
import { Mouse } from '../../mouse/mouse';
import { Selection } from '../../selection/selection';
import { SubgridsManager } from '../../subgrid/subgrids-manager';
import { ViewLayout } from '../../view/view-layout';
import { GridPainter } from './grid-painter';

/** @summary Render the grid only as needed ("partial render").
 * @desc Paints all the cells of a grid, one column at a time, but only as needed.
 *
 * Partial render is supported only by those cells whose cell renderer supports it by returning before rendering (based on `config.snapshot`).
 *
 * #### On reset
 *
 * Defers to {@link ViewLayout#paintCellsByColumnsAndRows|paintCellsByColumnsAndRows}, which clears the canvas, draws the grid, and draws the grid lines.
 *
 * #### On the next call (after reset)
 *
 * Each cell is drawn redrawn only when its appearance changes. This determination is made by the cell renderer by comparing with (and maintaining) `config.snapshot`. See {@link SimpleCell} for a sample implementation.
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * #### On subsequent calls
 *
 * Iterates through each cell, calling `_paintCell` with `undefined` prefill color. This signifies partial render to the {@link SimpleCell} cell renderer, which only renders the cell when it's text, font, or colors have changed.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by setting {@link CellEvent#reset|reset} on each.
 *
 * See also the discussion of clipping in {@link ViewLayout#paintCellsByColumns|paintCellsByColumns}.
 * @this {ViewLayout}
 * @param {CanvasEx.CanvasRenderingContext2DEx} gc TODO need to remove any type
 */
export class AsNeededGridPainter extends GridPainter {
    // private _byColumnsAndRowsPainter: ByColumnsAndRowsGridPainter;

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
            AsNeededGridPainter.key,
            AsNeededGridPainter.partial,
            undefined
        );
    }

    paintCells(gc: CanvasRenderingContext2DEx) {
        const viewLayoutColumns = this.viewLayout.columns;
        const columnCount = viewLayoutColumns.length;
        const viewLayoutRows = this.viewLayout.rows;
        const rowCount = viewLayoutRows.length;
        if (columnCount > 0 && rowCount > 0) {
            const lastColumnIndex = columnCount - 1;
            const pool = this.viewLayout.getColumnRowOrderedCellPool();
            // clipToGrid,
            // let firstVisibleColumnLeft: number;
            // let lastVisibleColumnRight: number;
            // if (C === 0) {
            //     firstVisibleColumnLeft = 0;
            //     lastVisibleColumnRight = 0;
            // } else {
            //     firstVisibleColumnLeft = this.visibleColumns[0].left;
            //     lastVisibleColumnRight = this.visibleColumns[cLast].right;
            // }
            const viewHeight = viewLayoutRows[rowCount - 1].bottom;


            // if (this.reset) {
            //     this.resetAllGridPaintersRequiredEventer([]);
            //     this.repaintAllRequiredEventer(gc);
            //     this.reset = false;
            // }

            // gc.clipSave(clipToGrid, firstVisibleColumnLeft, 0, lastVisibleColumnRight, viewHeight);

            let cellIndex = 0;
            // For each column...
            for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                const vc = viewLayoutColumns[columnIndex];

                let preferredWidth: number | undefined;

                // Optionally clip to visible portion of column to prevent text from overflowing to right.
                const columnClip = vc.column.settings.columnClip;
                gc.clipSave(columnClip ?? columnIndex === lastColumnIndex, 0, 0, vc.rightPlus1, viewHeight);

                // For each row of each subgrid (of each column)...
                for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                    const cell = pool[cellIndex++]; // next cell down the column (make sure correct pool is chosen above)

                    try {
                        // Partial render signaled by calling `_paintCell` with undefined 3rd param (formal `prefillColor`).
                        const paintWidth = this.paintCell(gc, cell, undefined);
                        if (paintWidth !== undefined) {
                            if (preferredWidth === undefined) {
                                preferredWidth = paintWidth;
                            } else {
                                preferredWidth = Math.max(preferredWidth, paintWidth);
                            }
                        }
                    } catch (e) {
                        this.paintErrorCell(e as Error, gc, vc, cell.visibleRow);
                    }
                }

                gc.clipRestore();

                if (preferredWidth !== undefined) {
                    vc.column.settings.preferredWidth = Math.ceil(preferredWidth);
                }
            }

            // gc.clipRestore(clipToGrid);

            // if (this.grid.properties.boxSizing === 'border-box') {
            //     this.renderer.paintGridlines(gc);
            // }
        }
    }
}

export namespace AsNeededGridPainter {
    export const key = 'as-needed';
    export const partial = true; // skip painting selectionRegionOverlayColor
}

