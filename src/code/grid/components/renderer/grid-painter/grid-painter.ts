import { GridSettings } from '../../../interfaces/grid-settings';
import { ViewLayoutColumn } from '../../../interfaces/view-layout-column';
import { ViewLayoutRow } from '../../../interfaces/view-layout-row';
import { RectangleInterface } from '../../../lib/rectangle-interface';
import { CanvasEx } from '../../canvas-ex/canvas-ex';
import { CanvasRenderingContext2DEx } from '../../canvas-ex/canvas-rendering-context-2d-ex';
import { ViewCell } from '../../cell/view-cell';
import { Focus } from '../../focus/focus';
import { Mouse } from '../../mouse/mouse';
import { Selection } from '../../selection/selection';
import { Subgrid } from '../../subgrid/subgrid';
import { SubgridsManager } from '../../subgrid/subgrids-manager';
import { ViewLayout } from '../../view/view-layout';

export abstract class GridPainter {
    private _columnBundles = new Array<GridPainter.ColumnBundle | undefined>();
    private _rowBundlesAndPrefixColors: GridPainter.RowBundlesAndPrefillColors | undefined;

    reset = false;
    rebundle: boolean | undefined;

    private _columnRebundlingRequired = false;
    private _rowRebundlingRequired = false;

    private _columnBundlesComputationId = -1;
    private _rowBundlesComputationId = -1;

    constructor(
        protected readonly gridProperties: GridSettings,
        protected readonly mouse: Mouse,
        protected readonly canvasEx: CanvasEx,
        protected readonly subgridsManager: SubgridsManager,
        protected readonly viewLayout: ViewLayout,
        protected readonly focus: Focus,
        protected readonly selection: Selection,
        protected readonly repaintAllRequiredEventer: GridPainter.RepaintAllRequiredEventer,
        public readonly key: string,
        public readonly partial: boolean,
        initialRebundle: boolean | undefined,
    ) {
        if (initialRebundle !== undefined) {
            this.rebundle = initialRebundle;
        }
    }

    flagColumnRebundlingRequired() {
        this._columnRebundlingRequired = true;
    }

    getColumnBundles(viewLayoutColumns: ViewLayoutColumn[]) {
        if (this._columnBundlesComputationId !== this.viewLayout.rowsColumnsComputationId || this._columnRebundlingRequired) {
            this._columnBundles = this.calculateColumnBundles(viewLayoutColumns);

            this._columnBundlesComputationId = this.viewLayout.rowsColumnsComputationId;
            this._columnRebundlingRequired = false;
        }
        return this._columnBundles;
    }

    getRowBundlesAndPrefillColors(viewLayoutRows: ViewLayoutRow[]) {
        if (this._rowBundlesComputationId !== this.viewLayout.rowsColumnsComputationId || this._rowRebundlingRequired) {
            this._rowBundlesAndPrefixColors = this.calculateRowBundlesAndPrefillColors(viewLayoutRows);

            this._rowBundlesComputationId = this.viewLayout.rowsColumnsComputationId;
            this._rowRebundlingRequired = false;
        }
        return this._rowBundlesAndPrefixColors;
    }

    abstract paintCells(gc: CanvasRenderingContext2DEx): void;

    protected paintCell(gc: CanvasRenderingContext2DEx, viewCell: ViewCell, prefillColor: string | undefined): number | undefined {
        const subgrid = viewCell.subgrid as Subgrid;
        const cellPainter = (subgrid as Subgrid).getCellPainter(viewCell, prefillColor);

        const info = cellPainter.paint(gc);
        viewCell.paintSnapshot = info.snapshot; // supports partial render

        return info.width;
    }

    paintErrorCell(err: Error, gc: CanvasRenderingContext2DEx, vc: ViewLayoutColumn, vr: ViewLayoutRow) {
        const message = (err && (err.message ?? `${err}`)) ?? 'Unknown error.';

        const bounds: RectangleInterface = { x: vc.left, y: vr.top, width: vc.width, height: vr.height };

        console.error(message);

        gc.cache.save(); // define clipping region
        gc.beginPath();
        gc.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        gc.clip();

        this.paintErrorMessage(gc, bounds, message);

        gc.cache.restore(); // discard clipping region
    }

    /**
     * @desc We opted to not paint borders for each cell as that was extremely expensive. Instead we draw grid lines here.
     */
    paintGridlines(gc: CanvasRenderingContext2DEx) {
        const viewLayoutColumns = this.viewLayout.columns;
        const columnCount = viewLayoutColumns.length;
        const viewLayoutRows = this.viewLayout.rows;
        const rowCount = viewLayoutRows.length;

        if (columnCount && rowCount) {
            const gridProps = this.gridProperties;
            const C1 = columnCount - 1;
            const R1 = rowCount - 1;
            const firstVisibleColumnLeft = viewLayoutColumns[0].left;
            const lastVisibleColumnRight = viewLayoutColumns[C1].rightPlus1;
            const viewWidth = lastVisibleColumnRight - firstVisibleColumnLeft;
            const viewHeight = viewLayoutRows[R1].bottom;
            const gridLinesVColor = gridProps.gridLinesVColor;
            const gridLinesHColor = gridProps.gridLinesHColor;
            // const borderBox = gridProps.boxSizing === 'border-box';

            if (
                gridProps.gridLinesV && ( // drawing vertical grid lines?
                    gridProps.gridLinesUserDataArea || // drawing vertical grid lines between data columns?
                    gridProps.gridLinesColumnHeader // drawing vertical grid lines between header columns?
                )
            ) {
                const gridLinesVWidth = gridProps.gridLinesVWidth;
                const headerRowCount = this.subgridsManager.calculateHeaderRowCount();
                const lastHeaderRow = viewLayoutRows[headerRowCount - 1]; // any header rows?
                const firstDataRow = viewLayoutRows[headerRowCount]; // any data rows?
                const userDataAreaTop = firstDataRow && firstDataRow.top;
                const top = gridProps.gridLinesColumnHeader ? 0 : userDataAreaTop;
                const bottom = gridProps.gridLinesUserDataArea ? viewHeight : lastHeaderRow && lastHeaderRow.bottom;

                if (top !== undefined && bottom !== undefined) { // either undefined means nothing to draw
                    gc.cache.fillStyle = gridLinesVColor;

                    viewLayoutColumns.forEach((vc, c) => {
                        if (
                            c < C1 // don't draw rule after last column
                        ) {
                            const x = vc.rightPlus1;
                            const height = bottom  - top;

                            // draw a single vertical grid line between both header and data cells OR a line segment in header only
                            gc.fillRect(x, top, gridLinesVWidth, height);

                            // when above drew a line segment in header, draw a second vertical grid line between data cells
                            if (gridProps.gridLinesUserDataArea) {
                                gc.fillRect(x, userDataAreaTop, gridLinesVWidth, bottom - userDataAreaTop);
                            }
                        }
                    });
                }
            }

            if (gridProps.gridLinesH && gridProps.gridLinesUserDataArea) {
                const gridLinesHWidth = gridProps.gridLinesHWidth;
                const width = lastVisibleColumnRight - firstVisibleColumnLeft;

                gc.cache.fillStyle = gridLinesHColor;

                viewLayoutRows.forEach(function(vr, r) {
                    if (r < R1) { // don't draw rule below last row
                        const y = vr.bottom;
                        gc.fillRect(firstVisibleColumnLeft, y, width, gridLinesHWidth);
                    }
                });
            }

            // draw fixed rule lines over grid rule lines

            if (gridProps.fixedLinesHWidth !== undefined) {
                const rowGap = viewLayoutRows.gap;
                if (rowGap !== undefined) {
                    gc.cache.fillStyle = gridProps.fixedLinesHColor || gridLinesHColor;
                    const edgeWidth = gridProps.fixedLinesHEdge;
                    if (edgeWidth !== undefined) {
                        gc.fillRect(firstVisibleColumnLeft, rowGap.top, viewWidth, edgeWidth);
                        gc.fillRect(firstVisibleColumnLeft, rowGap.bottom - edgeWidth, viewWidth, edgeWidth);
                    } else {
                        gc.fillRect(firstVisibleColumnLeft, rowGap.top, viewWidth, rowGap.bottom - rowGap.top);
                    }
                }
            }

            if (gridProps.fixedLinesVWidth !== undefined) {
                const columnGap = viewLayoutColumns.gap;
                if (columnGap !== undefined) {
                    gc.cache.fillStyle = gridProps.fixedLinesVColor || gridLinesVColor;
                    const edgeWidth = gridProps.fixedLinesVEdge;
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

    paintLastSelection(gc: CanvasRenderingContext2DEx, lastSelectionBounds: ViewCell.Bounds) {
        // Render the selection model around the last selection bounds
        const gridProps = this.gridProperties;
        const selectionRegionOverlayColor = this.partial ? 'transparent' : gridProps.selectionRegionOverlayColor;
        const selectionRegionOutlineColor = gridProps.selectionRegionOutlineColor;

        const visOverlay = gc.alpha(selectionRegionOverlayColor) > 0;
        const visOutline = gc.alpha(selectionRegionOutlineColor) > 0;

        if (visOverlay || visOutline) {
            const bounds = lastSelectionBounds;
            const x = bounds.x;
            const y = bounds.y;
            const width = bounds.width;
            const height = bounds.height;

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
        }

        return undefined;
    }

    private calculateColumnBundles(viewLayoutColumns: ViewLayoutColumn[]): GridPainter.ColumnBundle[] {
        const gridProps = this.gridProperties;
        const columnCount = viewLayoutColumns.length;

        const bundles = new Array<GridPainter.ColumnBundle>(columnCount); // max size
        const gridPrefillColor = gridProps.backgroundColor;

        let bundleCount = 0;

        for (let i = 0; i < columnCount; i++) {
            const vc = viewLayoutColumns[i];
            let bundle: GridPainter.ColumnBundle | undefined;
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

    private calculateRowBundlesAndPrefillColors(viewLayoutRows: ViewLayoutRow[]): GridPainter.RowBundlesAndPrefillColors | undefined {
        const gridProps = this.gridProperties;
        const stripes = gridProps.rowStripes;
        if (stripes === undefined) {
            return undefined;
        } else {
            const rowCount = viewLayoutRows.length

            const bundles = new Array<GridPainter.RowBundle>(rowCount); // set to max possible length
            const gridPrefillColor = gridProps.backgroundColor;
            const prefillColors = new Array<string>(rowCount);

            let bundle: GridPainter.RowBundle | undefined;
            let bundleCount = 0;
            for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                const vr = viewLayoutRows[rowIndex];
                let backgroundColor: string;
                if (!vr.subgrid.isMain) {
                    backgroundColor = gridPrefillColor;
                } else {
                    if (stripes.length === 0) {
                        backgroundColor = gridPrefillColor;
                    } else {
                        const stripe = stripes[vr.subgridRowIndex % stripes.length];
                        if (stripe === undefined) {
                            backgroundColor = gridPrefillColor;
                        } else {
                            backgroundColor = stripe.backgroundColor ?? gridPrefillColor;
                        }
                    }
                }
                prefillColors[rowIndex] = backgroundColor;
                if (bundle !== undefined && bundle.backgroundColor === backgroundColor) {
                    bundle.bottom = vr.bottom;
                } else {
                    if (backgroundColor === gridPrefillColor) {
                        bundle = undefined; // this looks wrong
                    } else {
                        bundle = {
                            backgroundColor: backgroundColor,
                            top: vr.top,
                            bottom: vr.bottom
                        };
                        bundles[bundleCount++] = bundle;
                    }
                }
            }
            // what about final bundle

            bundles.length = bundleCount;

            return {
                bundles: bundles,
                prefillColors: prefillColors,
            }
        }
    }

    private paintErrorMessage(gc: CanvasRenderingContext2DEx, bounds: RectangleInterface, message: string) {
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

export namespace GridPainter {
    export type ResetAllGridPaintersRequiredEventer = (this: void, blackList: string[]) => void;
    export type RepaintAllRequiredEventer = (this: void, gc: CanvasRenderingContext2DEx) => void;
    export type Constructor = new(
        gridProperties: GridSettings,
        mouse: Mouse,
        canvasEx: CanvasEx,
        subgridsManager: SubgridsManager,
        viewLayout: ViewLayout,
        focus: Focus,
        selection: Selection,
        repaintAllRequired: RepaintAllRequiredEventer,
    ) => GridPainter;

    export interface ColumnBundle {
        backgroundColor: string;
        left: number;
        right: number;
    }

    export interface RowBundle {
        backgroundColor: string;
        top: number;
        bottom: number;
    }

    export interface RowBundlesAndPrefillColors {
        bundles: RowBundle[];
        prefillColors: string[];
    }
}