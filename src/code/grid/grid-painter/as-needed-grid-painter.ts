
import { CanvasEx } from '../canvas/canvas-ex';
import { CanvasRenderingContext2DEx } from '../canvas/canvas-rendering-context-2d-ex';
import { Focus } from '../focus';
import { GridProperties } from '../grid-properties';
import { Renderer } from '../renderer/renderer';
import { Viewport } from '../renderer/viewport';
import { Selection } from '../selection/selection';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { Mouse } from '../user-interface-input/mouse';
import { ByColumnsAndRowsGridPainter } from './by-columns-and-rows-grid-painter';
import { GridPainter } from './grid-painter';

/** @summary Render the grid only as needed ("partial render").
 * @desc Paints all the cells of a grid, one column at a time, but only as needed.
 *
 * Partial render is supported only by those cells whose cell renderer supports it by returning before rendering (based on `config.snapshot`).
 *
 * #### On reset
 *
 * Defers to {@link Viewport#paintCellsByColumnsAndRows|paintCellsByColumnsAndRows}, which clears the canvas, draws the grid, and draws the grid lines.
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
 * See also the discussion of clipping in {@link Viewport#paintCellsByColumns|paintCellsByColumns}.
 * @this {Viewport}
 * @param {CanvasEx.CanvasRenderingContext2DEx} gc TODO need to remove any type
 */
export class AsNeededGridPainter extends GridPainter {
    private _byColumnsAndRowsPainter: ByColumnsAndRowsGridPainter;

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
            AsNeededGridPainter.key,
            AsNeededGridPainter.partial,
            undefined
        );
    }

    override initialise() {
        this._byColumnsAndRowsPainter = this.renderer.getGridPainter(ByColumnsAndRowsGridPainter.key) as ByColumnsAndRowsGridPainter;
    }

    paintCells(gc: CanvasRenderingContext2DEx) {
        const visibleColumns = this.viewportColumns;
        const visibleRows = this.viewportRows;
        const C = visibleColumns.length;
        const cLast = C - 1;
        const R = visibleRows.length;
        let p = 0;
        const pool = this.viewportCellPool;
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
        const viewHeight = R ? visibleRows[R - 1].bottom : 0;


        if (!C || !R) { return; }

        if (this.reset) {
            this.renderer.resetAllGridPainters();
            this._byColumnsAndRowsPainter.paintCells(gc);
            this.reset = false;
        }

        // gc.clipSave(clipToGrid, firstVisibleColumnLeft, 0, lastVisibleColumnRight, viewHeight);

        // For each column...
        this.viewportColumns.forEach((vc, c) => {
            let viewportCell = pool[p]; // first cell in column c
            vc = viewportCell.visibleColumn;

            let preferredWidth: number | undefined;

            // Optionally clip to visible portion of column to prevent text from overflowing to right.
            const columnClip = vc.column.properties.columnClip;
            gc.clipSave(columnClip ?? c === cLast, 0, 0, vc.rightPlus1, viewHeight);

            // For each row of each subgrid (of each column)...
            for (let r = 0; r < R; r++, p++) {
                viewportCell = pool[p]; // next cell down the column (redundant for first cell in column)

                try {
                    // Partial render signaled by calling `_paintCell` with undefined 3rd param (formal `prefillColor`).
                    const paintWidth = this.paintCell(gc, viewportCell, undefined);
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
            }

            gc.clipRestore();

            if (preferredWidth !== undefined) {
                viewportCell.visibleColumn.column.properties.preferredWidth = Math.ceil(preferredWidth);
            }
        });

        // gc.clipRestore(clipToGrid);

        // if (this.grid.properties.boxSizing === 'border-box') {
        //     this.renderer.paintGridlines(gc);
        // }
    }
}

export namespace AsNeededGridPainter {
    export const key = 'as-needed';
    export const partial = true; // skip painting selectionRegionOverlayColor
}

