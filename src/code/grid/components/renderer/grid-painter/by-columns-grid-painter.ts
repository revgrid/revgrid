
import { SchemaField } from '../../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../../interfaces/settings/behaviored-grid-settings';
import { GridSettings } from '../../../interfaces/settings/grid-settings';
import { Canvas } from '../../canvas/canvas';
import { Focus } from '../../focus/focus';
import { Mouse } from '../../mouse/mouse';
import { Selection } from '../../selection/selection';
import { SubgridsManager } from '../../subgrid/subgrids-manager';
import { ViewLayout } from '../../view/view-layout';
import { GridPainter } from './grid-painter';

/** @summary Render the grid with consolidated column rects.
 * @desc Paints all the cells of a grid, one column at a time.
 *
 * First, a background rect is drawn using the grid background color.
 *
 * Then, if there are any columns with their own background color _that differs from the grid background color,_ these are consolidated and the consolidated groups of column backgrounds are all drawn before iterating through cells. Note that these column rects are _not_ suitable for clipping overflow text from previous columns. If you have overflow text, either turn on clipping (`grid.properties.columnClip = true` but big performance hit) or turn on one of the `truncateTextWithEllipsis` options.
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by setting {@link CellEvent#reset|reset} on each.
 *
 * **Regading clipping.** The reason for clipping is to prevent text from overflowing into the next column. However there is a serious performance cost.
 *
 * For performance reasons {@link ViewLayout#_paintCell|_paintCell} does not set up a clipping region for each cell. However, iff grid property `columnClip` is truthy, this grid renderer will set up a clipping region to prevent text overflow to right. If `columnClip` is `null`, a clipping region will only be set up on the last column. Otherwise, there will be no clipping region.
 *
 * The idea of clipping just the last column is because in addition to the optional graphics clipping, we also clip ("truncate") text. Text can be truncated conservatively so it will never overflow. The problem with this is that characters vanish as they hit the right cell boundary, which may or may be obvious depending on font size. Alternatively, text can be truncated so that the overflow will be a maximum of 1 character. This allows partial characters to be rendered. But this is where graphics clipping is required.
 *
 * When renderering column by column as this particular renderer does, _and_ when the background color _of the next cell to the right_ is opaque (alpha = 1), clipping can be turned off because each column will _overpaint_ any text that overflowed from the one before. However, any text that overflows the last column will paint into unused canvas region to the right of the grid. This is the _raison d'être_ for "clip last column only" option mentioned above (when `columnClip` is set to `null`). To avoid even this performance cost (of clipping just the last column), column widths can be set to fill the available canvas.
 *
 * Note that text never overflows to left because text starting point is never < 0. The reason we don't clip to the left is for cell renderers that need to re-render to the left to produce a merged cell effect, such as grouped column header.
 */

export class ByColumnsGridPainter<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> extends GridPainter<BGS, BCS, SF> {
    constructor(
        gridSettings: GridSettings,
        canvas: Canvas<BGS>,
        subgridsManager: SubgridsManager<BCS, SF>,
        viewLayout: ViewLayout<BGS, BCS, SF>,
        focus: Focus<BGS, BCS, SF>,
        selection: Selection<BCS, SF>,
        mouse: Mouse<BGS, BCS, SF>,
        repaintAllRequiredEventer: GridPainter.RepaintAllRequiredEventer,
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
            ByColumnsGridPainter.key,
            false,
            ByColumnsGridPainter.initialRebundle
        );
    }

    paintCells() {
        const gc = this._renderingContext;
        const viewLayout = this.viewLayout;
        const viewLayoutColumns = viewLayout.columns;
        const viewLayoutRows = viewLayout.rows;
        const columnCount = viewLayoutColumns.length;
        const lastColumnIndex = columnCount - 1;
        const rowCount = viewLayoutRows.length;
        const pool = viewLayout.getColumnRowOrderedCellPool(); // must match algorithm below and computationInvalid above
            // clipToGrid;
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
        const viewHeight = rowCount !== 0 ? viewLayoutRows[rowCount - 1].bottomPlus1 : 0;

        const canvasBounds = this.canvas.flooredBounds;
        gc.clearRect(0, 0, canvasBounds.width, canvasBounds.height);

        if (!columnCount || !rowCount) { return; }

        const gridProps = this.gridSettings;
        const gridPrefillColor = gridProps.backgroundColor;
        if (gc.alpha(gridPrefillColor) > 0) {
            gc.cache.fillStyle = gridPrefillColor;
            gc.fillRect(firstVisibleColumnLeft, 0, viewWidth, viewHeight);
        }

        const columnBundles = this.getColumnBundles(viewLayoutColumns);
        const columnBundleCount = columnBundles.length;
        for (let i = columnBundleCount - 1; i > 0; i--) {
            const columnBundle = columnBundles[i];
            if (columnBundle !== undefined) {
                gc.clearFillRect(columnBundle.left, 0, columnBundle.right - columnBundle.left, viewHeight, columnBundle.backgroundColor);
            }
        }

        // gc.clipSave(clipToGrid, firstVisibleColumnLeft, 0, lastVisibleColumnRight, viewHeight);

        let cellIndex = 0;
        // For each column...
        for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
            const vc = viewLayoutColumns[columnIndex];

            const prefillColor = vc.column.settings.backgroundColor;

            // Optionally clip to visible portion of column to prevent text from overflowing to right.
            const columnClip = vc.column.settings.columnClip;
            gc.clipSave(columnClip ?? columnIndex === lastColumnIndex, 0, 0, vc.rightPlus1, viewHeight);

            let columnPreferredWidth: number | undefined;
            // For each row of each subgrid (of each column)...
            for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                const cell = pool[cellIndex++]; // next cell down the column (redundant for first cell in column)

                try {
                    const preferredWidth = this.paintCell(cell, prefillColor);
                    if (preferredWidth !== undefined) {
                        if (columnPreferredWidth === undefined) {
                            columnPreferredWidth = preferredWidth;
                        } else {
                            columnPreferredWidth = Math.max(columnPreferredWidth, preferredWidth);
                        }
                    }
                } catch (e) {
                    this.paintErrorCell(e as Error, vc, cell.viewLayoutRow);
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

export namespace ByColumnsGridPainter {
    export const key = 'by-columns';
    export const initialRebundle = true; // see rebundleGridRenderers
}
