
import { RevSchemaField } from '../../../../common/internal-api';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../../../settings/internal-api';
import { RevCanvas } from '../../canvas/canvas';
import { RevFocus } from '../../focus/focus';
import { RevMouse } from '../../mouse/mouse';
import { RevSelection } from '../../selection/selection';
import { RevSubgridsManager } from '../../subgrid/subgrids-manager';
import { RevViewLayout } from '../../view/view-layout';
import { RevGridPainter } from './grid-painter';

/** Render the grid with consolidated row OR column rects.
 * @remarks Paints all the cells of a grid, one column at a time.
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
 * See also the discussion of clipping in {@link RevViewLayout#paintCellsByColumns|paintCellsByColumns}.
 */
export class RevByColumnsAndRowsGridPainter<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevGridPainter<BGS, BCS, SF> {
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
            RevByColumnsAndRowsGridPainter.key,
            false,
            RevByColumnsAndRowsGridPainter.initialRebundle
        );
    }

    paintCells() {
        const gridSettings = this.gridSettings;
        const viewLayout = this.viewLayout;
        const viewLayoutColumns = viewLayout.columns;
        const columnCount = viewLayoutColumns.length;
        const viewLayoutRows = viewLayout.rows;
        const rowCount = viewLayoutRows.length;
        if (columnCount > 0 && rowCount > 0) {
            const gc = this._renderingContext;
            const lastColumnIndex = columnCount - 1;
            const pool = viewLayout.getColumnRowOrderedCellPool(); // must match algorithm below and computationInvalid above
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
            const viewHeight = viewLayoutRows[rowCount - 1].bottomPlus1;

            const canvasBounds = this.canvas.flooredBounds;
            gc.clearRect(0, 0, canvasBounds.width, canvasBounds.height);

            if (!columnCount || !rowCount) { return; }

            const gridPrefillColor = gridSettings.backgroundColor;
            if (gc.alpha(gridPrefillColor) > 0) {
                gc.cache.fillStyle = gridPrefillColor;
                gc.fillRect(firstVisibleColumnLeft, 0, viewWidth, viewHeight);
            }

            const rowStripeBackgroundColor = gridSettings.rowStripeBackgroundColor;
            if (rowStripeBackgroundColor !== undefined) {
                this.stripeRows(rowStripeBackgroundColor, firstVisibleColumnLeft, viewWidth);
            } else {
                const columnBundles = this.getColumnBundles(viewLayoutColumns);
                const columnBundleCount = columnBundles.length;
                for (let i = columnBundleCount - 1; i > 0; i--) {
                    const columnBundle = columnBundles[i];
                    if (columnBundle !== undefined) {
                        gc.clearFillRect(columnBundle.left, 0, columnBundle.right - columnBundle.left, viewHeight, columnBundle.backgroundColor);
                    }
                }
            }

            // gc.clipSave(clipToGrid, firstVisibleColumnLeft, 0, lastVisibleColumnRight, viewHeight);

            // For each column...
            let cellEvent = 0;
            for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                const viewColumn = viewLayoutColumns[columnIndex];

                // Optionally clip to visible portion of column to prevent text from overflowing to right.
                const columnClip = viewColumn.column.settings.columnClip;
                gc.clipSave(columnClip ?? columnIndex === lastColumnIndex, 0, 0, viewColumn.rightPlus1, viewHeight);

                let columnPreferredPaintWidth: number | undefined;
                // For each row of each subgrid (of each column)...
                for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                    let prefillColor: string;
                    if (rowStripeBackgroundColor === undefined) {
                        prefillColor = viewColumn.column.settings.backgroundColor;
                    } else {
                        const viewRow = viewLayoutRows[rowIndex];
                        if (this.isRowStriped(viewRow.subgridRowIndex)) {
                            prefillColor = rowStripeBackgroundColor;
                        } else {
                            prefillColor = gridSettings.backgroundColor;
                        }
                    }

                    const viewCell = pool[cellEvent++];

                    try {
                        const preferredPaintWidth = this.paintCell(viewCell, prefillColor);
                        if (preferredPaintWidth !== undefined) {
                            if (columnPreferredPaintWidth === undefined) {
                                columnPreferredPaintWidth = preferredPaintWidth;
                            } else {
                                columnPreferredPaintWidth = Math.max(columnPreferredPaintWidth, preferredPaintWidth);
                            }
                        }
                    } catch (e) {
                        this.paintErrorCell(e as Error, viewColumn, viewCell.viewLayoutRow);
                    }
                }

                gc.clipRestore();

                if (columnPreferredPaintWidth !== undefined) {
                    viewColumn.column.preferredWidth = Math.ceil(columnPreferredPaintWidth);
                }
            }

            // gc.clipRestore(clipToGrid);
        }
    }
}

export namespace RevByColumnsAndRowsGridPainter {
    export const key = 'by-columns-and-rows';
    export const initialRebundle = true; // see rebundleGridRenderers
}
