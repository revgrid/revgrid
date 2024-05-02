import { getErrorMessage } from '@xilytix/sysutils';
import { RevCachedCanvasRenderingContext2D, RevRectangle, RevSchemaField } from '../../../../common/internal-api';
import { RevViewCell } from '../../../interfaces/view-cell';
import { RevViewLayoutColumn } from '../../../interfaces/view-layout-column';
import { RevViewLayoutRow } from '../../../interfaces/view-layout-row';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings, RevOnlyGridSettings } from '../../../settings/internal-api';
import { RevCanvas } from '../../canvas/canvas';
import { RevFocus } from '../../focus/focus';
import { RevMouse } from '../../mouse/mouse';
import { RevSelection } from '../../selection/selection';
import { RevSubgridsManager } from '../../subgrid/subgrids-manager';
import { RevViewLayout } from '../../view/view-layout';

export abstract class RevGridPainter<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    protected _renderingContext: RevCachedCanvasRenderingContext2D;

    private _columnBundles = new Array<RevGridPainter.ColumnBundle | undefined>();

    reset = false;
    rebundle: boolean | undefined;

    private _columnRebundlingRequired = false;
    private _columnBundlesComputationId = -1;

    constructor(
        protected readonly gridSettings: RevGridSettings,
        protected readonly canvas: RevCanvas<BGS>,
        protected readonly subgridsManager: RevSubgridsManager<BCS, SF>,
        protected readonly viewLayout: RevViewLayout<BGS, BCS, SF>,
        protected readonly focus: RevFocus<BGS, BCS, SF>,
        protected readonly selection: RevSelection<BGS, BCS, SF>,
        protected readonly mouse: RevMouse<BGS, BCS, SF>,
        protected readonly repaintAllRequiredEventer: RevGridPainter.RepaintAllRequiredEventer,
        public readonly key: string,
        public readonly partial: boolean,
        initialRebundle: boolean | undefined,
    ) {
        this._renderingContext = this.canvas.gc;
        if (initialRebundle !== undefined) {
            this.rebundle = initialRebundle;
        }
    }

    flagColumnRebundlingRequired() {
        this._columnRebundlingRequired = true;
    }

    getColumnBundles(viewLayoutColumns: RevViewLayoutColumn<BCS, SF>[]) {
        if (this._columnBundlesComputationId !== this.viewLayout.rowsColumnsComputationId || this._columnRebundlingRequired) {
            this._columnBundles = this.calculateColumnBundles(viewLayoutColumns);

            this._columnBundlesComputationId = this.viewLayout.rowsColumnsComputationId;
            this._columnRebundlingRequired = false;
        }
        return this._columnBundles;
    }

    abstract paintCells(): void;

    protected paintCell(
        viewCell: RevViewCell<BCS, SF>,
        prefillColor: string | undefined,
    ): number | undefined {
        const focus = this.focus;
        const focusCell = focus.cell;
        if (focusCell === viewCell) { // does cell have focus
            const editor = focus.editor;
            if (editor !== undefined) { // is editor active
                if (editor.paint !== undefined) { // should editor be painted
                    return editor.paint(viewCell, prefillColor);
                } else {
                    return undefined; // Cell does not need painting while editor is active
                }
            }
        }
        const cellPainter = viewCell.subgrid.getCellPainterEventer(viewCell);
        return cellPainter.paint(viewCell, prefillColor);
    }

    paintErrorCell(err: Error, vc: RevViewLayoutColumn<BCS, SF>, vr: RevViewLayoutRow<BCS, SF>) {
        const gc = this._renderingContext;
        const message = getErrorMessage(err);

        const bounds: RevRectangle = { x: vc.left, y: vr.top, width: vc.width, height: vr.height };

        console.error(message);

        gc.cache.save(); // define clipping region
        gc.beginPath();
        gc.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        gc.clip();

        this.paintErrorMessage(gc, bounds, message);

        gc.cache.restore(); // discard clipping region
    }

    /**
     * We opted to not paint borders for each cell as that was extremely expensive. Instead we draw grid lines here.
     */
    paintGridlines() {
        const viewLayoutColumns = this.viewLayout.columns;
        const columnCount = viewLayoutColumns.length;
        const viewLayoutRows = this.viewLayout.rows;
        const rowCount = viewLayoutRows.length;

        if (columnCount > 0 && rowCount > 0) {
            const gc = this._renderingContext;
            const gridSettings = this.gridSettings;
            const lastColumnIndex = columnCount - 1;
            const lastRowIndex = rowCount - 1;
            const firstVisibleColumnLeft = viewLayoutColumns[0].left;
            const lastVisibleColumnRight = viewLayoutColumns[lastColumnIndex].rightPlus1;
            const viewWidth = lastVisibleColumnRight - firstVisibleColumnLeft;
            const viewHeight = viewLayoutRows[lastRowIndex].bottomPlus1;
            const verticalGridLinesColor = gridSettings.verticalGridLinesColor;
            const horizontalGridLinesColor = gridSettings.horizontalGridLinesColor;
            // const borderBox = gridProps.boxSizing === 'border-box';

            const verticalGridLinesWidth = gridSettings.verticalGridLinesWidth;
            if (gridSettings.verticalGridLinesVisible && verticalGridLinesWidth > 0) {
                const top = 0;
                let bottomPlus1: number | undefined;
                if (!gridSettings.visibleVerticalGridLinesDrawnInFixedAndPreMainOnly) {
                    bottomPlus1 = viewHeight;
                } else {
                    const preMainPlusFixedRowCount = this.subgridsManager.calculatePreMainPlusFixedRowCount();
                    if (preMainPlusFixedRowCount > 0) {
                        const lastPreMainOrFixedRow = viewLayoutRows[preMainPlusFixedRowCount - 1]; // any header rows?
                        bottomPlus1 = lastPreMainOrFixedRow.bottomPlus1;
                    }
                }

                if (bottomPlus1 !== undefined) { // else do not draw as only draw in fixed and pre main but no rows in fixed or pre main
                    gc.cache.lineCap = 'butt';
                    gc.cache.strokeStyle = verticalGridLinesColor;
                    gc.cache.lineWidth = verticalGridLinesWidth;

                    for (let c = 0; c < lastColumnIndex; c++) {
                        const vc = viewLayoutColumns[c];
                        const x = vc.rightPlus1 + 0.5 * verticalGridLinesWidth;

                        // draw a single vertical grid line between both header and data cells OR a line segment in header only
                        gc.beginPath();
                        gc.moveTo(x, top);
                        gc.lineTo(x, bottomPlus1);
                        gc.stroke();
                    }
                }
            }

            const horizontalGridLinesWidth = gridSettings.horizontalGridLinesWidth;
            if (gridSettings.horizontalGridLinesVisible && horizontalGridLinesWidth > 0) {
                const width = lastVisibleColumnRight - firstVisibleColumnLeft;

                gc.cache.lineCap = 'butt';
                gc.cache.strokeStyle = horizontalGridLinesColor;
                gc.cache.lineWidth = horizontalGridLinesWidth;

                // don't draw rule below last row
                for (let rowIndex = 0; rowIndex < lastRowIndex; rowIndex++) {
                    const vr = viewLayoutRows[rowIndex];
                    const y = vr.bottomPlus1 + 0.5 * horizontalGridLinesWidth;
                    gc.beginPath();
                    gc.moveTo(firstVisibleColumnLeft, y);
                    gc.lineTo(firstVisibleColumnLeft + width, y);
                    gc.stroke();
                }
            }

            // draw fixed rule lines over grid rule lines

            if (gridSettings.horizontalFixedLineWidth !== undefined) {
                const rowGap = viewLayoutRows.gap;
                if (rowGap !== undefined) {
                    gc.cache.fillStyle = gridSettings.horizontalFixedLineColor || horizontalGridLinesColor;
                    const edgeWidth = gridSettings.horizontalFixedLineEdgeWidth;
                    if (edgeWidth !== undefined) {
                        gc.fillRect(firstVisibleColumnLeft, rowGap.top, viewWidth, edgeWidth);
                        gc.fillRect(firstVisibleColumnLeft, rowGap.bottom - edgeWidth, viewWidth, edgeWidth);
                    } else {
                        gc.fillRect(firstVisibleColumnLeft, rowGap.top, viewWidth, rowGap.bottom - rowGap.top);
                    }
                }
            }

            if (gridSettings.verticalFixedLineWidth !== undefined) {
                const columnGap = viewLayoutColumns.gap;
                if (columnGap !== undefined) {
                    gc.cache.fillStyle = gridSettings.verticalFixedLineColor || verticalGridLinesColor;
                    const edgeWidth = gridSettings.verticalFixedLineEdgeWidth;
                    if (edgeWidth !== undefined) {
                        gc.fillRect(columnGap.left, 0, edgeWidth, viewHeight);
                        gc.fillRect(columnGap.rightPlus1 - edgeWidth, 0, edgeWidth, viewHeight);
                    } else {
                        gc.fillRect(columnGap.left, 0, columnGap.rightPlus1 - columnGap.left, viewHeight);
                    }
                }
            }
        }
    }

    checkPaintLastSelection() {
        const gridSettings = this.gridSettings;
        let selectionRegionOverlayColor = gridSettings.selectionRegionOverlayColor;
        let selectionRegionOutlineColor = gridSettings.selectionRegionOutlineColor;

        if (selectionRegionOverlayColor !== undefined || selectionRegionOutlineColor !== undefined) {
            if (selectionRegionOverlayColor === undefined || this.partial) {
                selectionRegionOverlayColor = 'transparent';
            }
            if (selectionRegionOutlineColor === undefined) {
                selectionRegionOutlineColor = 'transparent';
            }
            const gc = this._renderingContext;
            const visOverlay = gc.alpha(selectionRegionOverlayColor) > 0;
            const visOutline = gc.alpha(selectionRegionOutlineColor) > 0;

            if (visOverlay || visOutline) {
                const lastSelectionBounds = this.calculateLastSelectionBounds();

                if (lastSelectionBounds !== undefined) {
                    // Render the selection model around the last selection bounds
                    const x = lastSelectionBounds.x;
                    const y = lastSelectionBounds.y;
                    const width = lastSelectionBounds.width;
                    const height = lastSelectionBounds.height;

                    gc.beginPath();

                    gc.rect(x, y, width, height);

                    if (visOverlay) {
                        gc.cache.fillStyle = selectionRegionOverlayColor;
                        gc.fill();
                    }

                    if (visOutline) {
                        gc.cache.lineWidth = 1;
                        gc.cache.strokeStyle = selectionRegionOutlineColor;
                        gc.stroke();
                    }

                    gc.closePath();

                    // if (this._gridPainter.key === 'by-cells') {
                    //     this._gridPainter.reset = true; // fixes GRID-490
                    // }
                }
            }
        }
    }

    calculateLastSelectionBounds(): RevRectangle | undefined {
        const columns = this.viewLayout.columns;
        const rows = this.viewLayout.rows;
        const columnCount = columns.length;
        const rowCount = rows.length;

        if (columnCount === 0 || rowCount === 0) {
            // nothing visible
            return undefined;
        }

        const gridProps = this.gridSettings;
        const selection = this.selection;

        const selectionArea = selection.lastArea;

        if (selectionArea === undefined) {
            return undefined; // no selection
        } else {
            const firstScrollableColumnIndex = this.viewLayout.firstScrollableColumnIndex;
            const firstScrollableRowIndex = this.viewLayout.firstScrollableRowIndex;
            if (firstScrollableColumnIndex === undefined || firstScrollableRowIndex === undefined) {
                // selection needs scrollable data
                return undefined;
            } else {
                const preMainRowCount = this.viewLayout.preMainRowCount;

                let vc: RevViewLayoutColumn<BCS, SF>;
                let vr: RevViewLayoutRow<BCS, SF>;
                const lastScrollableColumn = columns[columnCount - 1]; // last column in scrollable section
                const lastScrollableRow = rows[rowCount - 1]; // last row in scrollable data section
                const firstScrollableColumn = columns[firstScrollableColumnIndex];
                const firstScrollableActiveColumnIndex = firstScrollableColumn.activeColumnIndex;
                const firstScrollableRow = rows[firstScrollableRowIndex];
                const firstScrollableSubgridRowIndex = firstScrollableRow.subgridRowIndex;
                const fixedColumnCount = gridProps.fixedColumnCount;
                const fixedRowCount = gridProps.fixedRowCount;

                if (
                    // entire selection scrolled out of view to left of visible columns; or
                    (vc = columns[0]) && selectionArea.inclusiveRight < vc.activeColumnIndex ||

                    // entire selection scrolled out of view between fixed columns and scrollable columns; or
                    fixedColumnCount > 0 &&
                    (vc = columns[fixedColumnCount - 1]) &&
                    selectionArea.left > vc.activeColumnIndex &&
                    selectionArea.inclusiveRight < firstScrollableColumn.activeColumnIndex ||

                    // entire selection scrolled out of view to right of visible columns; or
                    lastScrollableColumn &&
                    selectionArea.left > lastScrollableColumn.activeColumnIndex ||

                    // entire selection scrolled out of view above visible rows; or
                    (vr = rows[preMainRowCount]) &&
                    selectionArea.inclusiveBottom < vr.subgridRowIndex ||

                    // entire selection scrolled out of view between fixed rows and scrollable rows; or
                    fixedRowCount > 0 &&
                    firstScrollableRow !== undefined &&
                    (vr = rows[preMainRowCount + fixedRowCount - 1]) &&
                    selectionArea.top > vr.subgridRowIndex &&
                    selectionArea.inclusiveBottom < firstScrollableRow.subgridRowIndex ||

                    // entire selection scrolled out of view below visible rows
                    lastScrollableRow &&
                    selectionArea.top > lastScrollableRow.subgridRowIndex
                ) {
                    return undefined;
                } else {
                    const scrolledColumnCount = firstScrollableActiveColumnIndex - 1;
                    const scrolledRowCount = firstScrollableSubgridRowIndex - 1;

                    const vcOrigin = columns[selectionArea.left - scrolledColumnCount];
                    const vrOrigin = rows[selectionArea.top - scrolledRowCount];
                    const vcCorner = columns[selectionArea.inclusiveRight - scrolledColumnCount];
                    const vrCorner = rows[selectionArea.inclusiveBottom - scrolledRowCount];

                    if (!(vcOrigin && vrOrigin && vcCorner && vrCorner)) {
                        return undefined;
                    } else {
                        const bounds: RevRectangle = {
                            x: vcOrigin.left,
                            y: vrOrigin.top,
                            width: vcCorner.rightPlus1 - vcOrigin.left,
                            height: vrCorner.bottomPlus1 - vrOrigin.top
                        };

                        return bounds;
                    }
                }
            }
        }
    }

    protected stripeRows(stripeColor: RevOnlyGridSettings.Color, left: number, width: number) {
        const gc = this._renderingContext;
        const rows = this.viewLayout.rows;
        const rowCount = rows.length;
        for (let i = 0; i < rowCount; i++) {
            const row = rows[i];
            const subgridRowIndex = row.subgridRowIndex;
            if (this.isRowStriped(subgridRowIndex)) {
                gc.clearFillRect(left, row.top, width, row.bottomPlus1 - row.top, stripeColor);
            }
        }
    }

    protected isRowStriped(subgridRowIndex: number) {
        return subgridRowIndex % 2 === 1;
    }

    private calculateColumnBundles(viewLayoutColumns: RevViewLayoutColumn<BCS, SF>[]): RevGridPainter.ColumnBundle[] {
        const gridSettings = this.gridSettings;
        const columnCount = viewLayoutColumns.length;

        const bundles = new Array<RevGridPainter.ColumnBundle>(columnCount); // max size
        const gridPrefillColor = gridSettings.backgroundColor;

        let bundleCount = 0;

        for (let i = 0; i < columnCount; i++) {
            const vc = viewLayoutColumns[i];
            let bundle: RevGridPainter.ColumnBundle | undefined;
            const backgroundColor = vc.column.settings.backgroundColor;
            if (bundle !== undefined && bundle.backgroundColor === backgroundColor) {
                bundle.right = vc.rightPlus1;
            } else {
                if (backgroundColor === gridPrefillColor) {
                    bundle = undefined;
                } else {
                    bundle = {
                        backgroundColor: backgroundColor,
                        left: vc.left,
                        right: vc.rightPlus1
                    };
                    bundles[bundleCount++] = bundle;
                }
            }
        }

        bundles.length = bundleCount;

        return bundles;
    }

    private paintErrorMessage(gc: RevCachedCanvasRenderingContext2D, bounds: RevRectangle, message: string) {
        const x = bounds.x;
        const y = bounds.y;
        // const width = config.bounds.width;
        const height = bounds.height;

        // clear the cell
        // (this makes use of the rect path defined by the caller)
        gc.cache.fillStyle = '#FFD500';
        gc.fill();

        // render message text
        gc.cache.fillStyle = '#A00';
        gc.cache.textAlign = 'start';
        gc.cache.textBaseline = 'middle';
        gc.cache.font = 'bold 6pt "arial narrow", verdana, geneva';
        gc.fillText(message, x + 4, y + height / 2 + 0.5);
    }
}

export namespace RevGridPainter {
    export type ResetAllGridPaintersRequiredEventer = (this: void, blackList: string[]) => void;
    export type RepaintAllRequiredEventer = (this: void) => void;
    export type Constructor<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = new(
        gridSettings: RevGridSettings,
        canvas: RevCanvas<BGS>,
        subgridsManager: RevSubgridsManager<BCS, SF>,
        viewLayout: RevViewLayout<BGS, BCS, SF>,
        focus: RevFocus<BGS, BCS, SF>,
        selection: RevSelection<BGS, BCS, SF>,
        mouse: RevMouse<BGS, BCS, SF>,
        repaintAllRequired: RepaintAllRequiredEventer,
    ) => RevGridPainter<BGS, BCS, SF>;

    export interface ColumnBundle {
        backgroundColor: string;
        left: number;
        right: number;
    }
}
