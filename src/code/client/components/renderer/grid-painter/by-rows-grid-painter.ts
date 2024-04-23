
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

/** Render the grid.
 * @remarks _**NOTE:** This grid renderer is not as performant as the others and it's use is not recommended if you care about performance. The reasons for the wanting performance are unclear, possibly having to do with the way Chrome optimizes access to the column objects?_
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
export class ByRowsGridPainter<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> extends GridPainter<BGS, BCS, SF> {
    constructor(
        gridSettings: GridSettings,
        canvas: Canvas<BGS>,
        subgridsManager: SubgridsManager<BCS, SF>,
        viewLayout: ViewLayout<BGS, BCS, SF>,
        focus: Focus<BGS, BCS, SF>,
        selection: Selection<BGS, BCS, SF>,
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
            ByRowsGridPainter.key,
            false,
            undefined
        );
    }

    paintCells() {
        const gc = this._renderingContext;
        const gridSettings = this.gridSettings;
        const gridPrefillColor = gridSettings.backgroundColor;
        const viewLayout = this.viewLayout;
        const viewLayoutColumns = viewLayout.columns;
        const columnCount = viewLayoutColumns.length;
        const viewLayoutRows = viewLayout.rows;
        const rowCount = viewLayoutRows.length;
        const lastColumnIndex = columnCount - 1;
        const pool = viewLayout.getRowColumnOrderedCellPool(); // must match algorithm below and computationInvalid above
        const columnPreferredWidths = new Array<number | undefined>(columnCount);
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
        const lineWidth = gridSettings.horizontalGridLinesWidth;
        const lineColor = gridSettings.horizontalGridLinesColor;
        const drawLines = gridSettings.horizontalGridLinesVisible && lineWidth > 0;

        const canvasBounds = this.canvas.flooredBounds;
        gc.clearRect(0, 0, canvasBounds.width, canvasBounds.height);

        if (!columnCount || !rowCount) { return; }

        if (gc.alpha(gridPrefillColor) > 0) {
            gc.cache.fillStyle = gridPrefillColor;
            gc.fillRect(firstVisibleColumnLeft, 0, viewWidth, viewHeight);
        }

        const rowStripeBackgroundColor = gridSettings.rowStripeBackgroundColor;
        if (rowStripeBackgroundColor !== undefined) {
            this.stripeRows(rowStripeBackgroundColor, firstVisibleColumnLeft, viewWidth);
        }

        // gc.clipSave(clipToGrid, firstVisibleColumnLeft, 0, lastVisibleColumnRight, viewHeight);

        let cellIndex = 0;
        // For each row of each subgrid...
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            const viewRow = viewLayoutRows[rowIndex];

            let prefillColor: string;
            if (rowStripeBackgroundColor === undefined) {
                prefillColor = gridSettings.backgroundColor;
            } else {
                if (this.isRowStriped(viewRow.subgridRowIndex)) {
                    prefillColor = rowStripeBackgroundColor;
                } else {
                    prefillColor = gridSettings.backgroundColor;
                }
            }

            if (drawLines) {
                gc.cache.fillStyle = lineColor;
                gc.fillRect(firstVisibleColumnLeft, viewRow.bottomPlus1, viewWidth, lineWidth);
            }

            // For each column (of each row)... (make sure correct pool is used)
            for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                const viewColumn = viewLayoutColumns[columnIndex];
                const viewCell = pool[cellIndex++];

                // Optionally clip to visible portion of column to prevent text from overflowing to right.
                const columnClip = viewColumn.column.settings.columnClip;
                gc.clipSave(columnClip ?? columnIndex === lastColumnIndex, 0, 0, viewColumn.rightPlus1, viewHeight);

                try {
                    const preferredWidth = this.paintCell(viewCell, prefillColor);
                    if (preferredWidth !== undefined) {
                        const previousColumnMaxPaintWidth = columnPreferredWidths[columnIndex];
                        if (previousColumnMaxPaintWidth === undefined) {
                            columnPreferredWidths[columnIndex] = preferredWidth;
                        } else {
                            columnPreferredWidths[columnIndex] = Math.max(previousColumnMaxPaintWidth, preferredWidth);
                        }
                    }
                } catch (e) {
                    this.paintErrorCell(e as Error, viewColumn, viewLayoutRows[rowIndex]);
                }

                gc.clipRestore();
            }
        }

        // gc.clipRestore(clipToGrid);

        for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
            const vc = viewLayoutColumns[columnIndex];
            const columnPreferredWidth = columnPreferredWidths[columnIndex];
            if (columnPreferredWidth !== undefined) {
                vc.column.preferredWidth = Math.ceil(columnPreferredWidth);
            }
        }
    }
}

export namespace ByRowsGridPainter {
    export const key = 'by-rows';
}
