
import { RevSchemaField } from '../../../../common/internal-api';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../../../settings/internal-api';
import { RevCanvas } from '../../canvas/canvas';
import { RevFocus } from '../../focus/focus';
import { RevMouse } from '../../mouse/mouse';
import { RevSelection } from '../../selection/selection';
import { RevSubgridsManager } from '../../subgrid/subgrids-manager';
import { RevViewLayout } from '../../view/view-layout';
import { RevGridPainter } from './grid-painter';

/** Render the grid only as needed ("partial render").
 * @remarks Paints all the cells of a grid, one column at a time, but only as needed.
 *
 * Partial render is supported only by those cells whose cell renderer supports it by returning before rendering (based on `config.snapshot`).
 *
 * #### On the next call (after reset)
 *
 * Each cell is drawn redrawn only when its appearance changes. This determination is made by the cell renderer by comparing with (and maintaining) `config.snapshot`. See XXX for a sample implementation.
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * #### On subsequent calls
 *
 * Iterates through each cell, calling `_paintCell` with `undefined` prefill color. This signifies partial render to the XXX cell renderer, which only renders the cell when it's text, font, or colors have changed.
 *
 * @param {RevCanvas.CanvasRenderingContext2DEx} gc TODO need to remove any type
 */
export class RevAsNeededGridPainter<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevGridPainter<BGS, BCS, SF> {
    // private _byColumnsAndRowsPainter: ByColumnsAndRowsGridPainter;

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
            RevAsNeededGridPainter.key,
            RevAsNeededGridPainter.partial,
        );
    }

    paintCells() {
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
            // let firstVisibleColumnLeft: number;
            // let lastVisibleColumnRight: number;
            // if (C === 0) {
            //     firstVisibleColumnLeft = 0;
            //     lastVisibleColumnRight = 0;
            // } else {
            //     firstVisibleColumnLeft = this.visibleColumns[0].left;
            //     lastVisibleColumnRight = this.visibleColumns[cLast].right;
            // }
            const viewHeight = viewLayoutRows[rowCount - 1].bottomPlus1;


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

                let columnPreferredWidth: number | undefined;

                // Optionally clip to visible portion of column to prevent text from overflowing to right.
                const columnClip = vc.column.settings.columnClip;
                gc.clipSave(columnClip ?? columnIndex === lastColumnIndex, 0, 0, vc.rightPlus1, viewHeight);

                // For each row of each subgrid (of each column)...
                for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                    const cell = pool[cellIndex++]; // next cell down the column (make sure correct pool is chosen above)

                    try {
                        // Partial render signaled by calling `_paintCell` with undefined 3rd param (formal `prefillColor`).
                        const preferredWidth = this.paintCell(cell, undefined);
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

            // if (this.grid.properties.boxSizing === 'border-box') {
            //     this.renderer.paintGridlines(gc);
            // }
        }
    }
}

export namespace RevAsNeededGridPainter {
    export const key = 'as-needed';
    export const partial = true; // skip painting selectionRegionOverlayColor
}

