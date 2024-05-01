import { RevSchemaField } from '../../../interfaces/schema/schema-field';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../../../settings/internal-api';
import { RevCanvas } from '../../canvas/canvas';
import { RevFocus } from '../../focus/focus';
import { RevMouse } from '../../mouse/mouse';
import { RevSelection } from '../../selection/selection';
import { RevSubgridsManager } from '../../subgrid/subgrids-manager';
import { RevViewLayout } from '../../view/view-layout';
import { RevGridPainter } from './grid-painter';

/** Render the grid with discrete column rects.
 * @remarks Paints all the cells of a grid, one column at a time.
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
 * See also the discussion of clipping in {@link RevViewLayout#paintCellsByColumnsDiscrete|paintCellsByColumnsDiscrete}.
 */

export class RevByColumnsDiscreteGridPainter<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevGridPainter<BGS, BCS, SF> {
    constructor(
        gridSettings: RevGridSettings,
        canvas: RevCanvas<BGS>,
        subgridsManager: RevSubgridsManager<BCS, SF>,
        viewLayout: RevViewLayout<BGS, BCS, SF>,
        focus: RevFocus<BGS, BCS, SF>,
        selection: RevSelection<BGS, BCS, SF>,
        mouse: RevMouse<BGS, BCS, SF>,
        repaintAllRequiredEventer: RevGridPainter.RepaintAllRequiredEventer,
    ) {
        super(
            gridSettings,
            canvas,
            subgridsManager,
            viewLayout,
            focus,
            selection,
            mouse,
            repaintAllRequiredEventer,
            RevByColumnsDiscreteGridPainter.key,
            false,
            undefined
        );
    }

    paintCells() {
        const gc = this._renderingContext;
        const viewLayout = this.viewLayout;
        const viewLayoutColumns = viewLayout.columns;
        const columnCount = viewLayoutColumns.length;
        const viewLayoutRows = viewLayout.rows;
        const rowCount = viewLayoutRows.length;
        const lastColumnIndex = columnCount - 1;
        const pool = viewLayout.getColumnRowOrderedCellPool(); // must match algorithm below and computationInvalid above
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
        const viewHeight = rowCount !== 0 ? viewLayoutRows[rowCount - 1].bottomPlus1 : 0;

        const canvasBounds = this.canvas.flooredBounds;
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
            gc.clearFillRect(vc.left, 0, vc.width, viewHeight, prefillColor);

            // Optionally clip to visible portion of column to prevent text from overflowing to right.
            const columnClip = vc.column.settings.columnClip;
            gc.clipSave(columnClip ?? columnIndex === lastColumnIndex, 0, 0, vc.rightPlus1, viewHeight);

            let columnPreferredWidth: number | undefined;
            // For each row of each subgrid (of each column)...
            for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                const viewCell = pool[cellIndex++]; // next cell down the column (make sure the correct pool is used above)

                try {
                    const preferredWidth = this.paintCell(viewCell, prefillColor);
                    if (preferredWidth !== undefined) {
                        if (columnPreferredWidth === undefined) {
                            columnPreferredWidth = preferredWidth;
                        } else {
                            columnPreferredWidth = Math.max(columnPreferredWidth, preferredWidth);
                        }
                    }
                } catch (e) {
                    this.paintErrorCell(e as Error, vc, viewCell.viewLayoutRow);
                }
            }

            gc.clipRestore();

            if (columnPreferredWidth !== undefined) {
                vc.column.preferredWidth = Math.ceil(columnPreferredWidth);
            }
        }

        // gc.clipRestore(clipToGrid);
    }
}

export namespace RevByColumnsDiscreteGridPainter {
    export const key = 'by-columns-discrete';
}
