import { GridSettings } from '../../../interfaces/grid-settings';
import { RectangleInterface } from '../../../lib/rectangle-interface';
import { CanvasEx } from '../../canvas-ex/canvas-ex';
import { CanvasRenderingContext2DEx } from '../../canvas-ex/canvas-rendering-context-2d-ex';
import { Focus } from '../../focus/focus';
import { Mouse } from '../../mouse/mouse';
import { Selection } from '../../selection/selection';
import { Subgrid } from '../../subgrid/subgrid';
import { SubgridsManager } from '../../subgrid/subgrids-manager';
import { ViewCell } from '../../view/view-cell';
import { ViewLayout } from '../../view/view-layout';

export abstract class GridPainter {
    protected readonly viewLayoutColumns: ViewLayout.ViewLayoutColumnArray;
    protected readonly viewLayoutRows: ViewLayout.ViewLayoutRowArray;
    protected readonly viewCellPool: ViewCell[];

    protected columnBundles = new Array<GridPainter.ColumnBundle | undefined>();
    protected rowBundles = new Array<GridPainter.RowBundle>();
    protected rowPrefillColors = new Array<string>();

    reset = false;
    rebundle: boolean;

    constructor(
        protected readonly gridProperties: GridSettings,
        protected readonly mouse: Mouse,
        protected readonly canvasEx: CanvasEx,
        protected readonly subgridsManager: SubgridsManager,
        protected readonly viewLayout: ViewLayout,
        protected readonly focus: Focus,
        protected readonly selection: Selection,
        protected readonly resetAllGridPaintersRequiredEventer: GridPainter.ResetAllGridPaintersRequiredEventer,
        protected readonly repaintAllRequiredEventer: GridPainter.RepaintAllRequiredEventer,
        public readonly key: string,
        public readonly partial: boolean,
        initialRebundle: boolean | undefined,
    ) {
        this.viewLayoutColumns = this.viewLayout.columns;
        this.viewLayoutRows = this.viewLayout.rows;
        this.viewCellPool = this.viewLayout.cellPool as ViewCell[];

        if (initialRebundle !== undefined) {
            this.rebundle = initialRebundle;
        }
    }

    abstract paintCells(gc: CanvasRenderingContext2DEx): void;

    protected paintCell(gc: CanvasRenderingContext2DEx, viewCell: ViewCell, prefillColor: string | undefined): number | undefined {
        const subgrid = viewCell.subgrid as Subgrid;
        const cellPainter = (subgrid as Subgrid).getCellPainter(viewCell, prefillColor);

        const info = cellPainter.paint(gc);
        viewCell.paintSnapshot = info.snapshot; // supports partial render

        return info.width;
    }

    paintErrorCell(err: Error, gc: CanvasRenderingContext2DEx, vc: ViewLayout.ViewLayoutColumn, vr: ViewLayout.ViewLayoutRow) {
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
        const visibleColumns = this.viewLayoutColumns;
        const C = visibleColumns.length;
        const visibleRows = this.viewLayoutRows;
        const R = visibleRows.length;

        if (C && R) {
            const gridProps = this.gridProperties;
            const C1 = C - 1;
            const R1 = R - 1;
            const firstVisibleColumnLeft = visibleColumns[0].left;
            const lastVisibleColumnRight = visibleColumns[C1].rightPlus1;
            const viewWidth = lastVisibleColumnRight - firstVisibleColumnLeft;
            const viewHeight = visibleRows[R1].bottom;
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
                const lastHeaderRow = visibleRows[headerRowCount - 1]; // any header rows?
                const firstDataRow = visibleRows[headerRowCount]; // any data rows?
                const userDataAreaTop = firstDataRow && firstDataRow.top;
                const top = gridProps.gridLinesColumnHeader ? 0 : userDataAreaTop;
                const bottom = gridProps.gridLinesUserDataArea ? viewHeight : lastHeaderRow && lastHeaderRow.bottom;

                if (top !== undefined && bottom !== undefined) { // either undefined means nothing to draw
                    gc.cache.fillStyle = gridLinesVColor;

                    visibleColumns.forEach((vc, c) => {
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

                visibleRows.forEach(function(vr, r) {
                    if (r < R1) { // don't draw rule below last row
                        const y = vr.bottom;
                        gc.fillRect(firstVisibleColumnLeft, y, width, gridLinesHWidth);
                    }
                });
            }

            // draw fixed rule lines over grid rule lines

            if (gridProps.fixedLinesHWidth !== undefined) {
                const rowGap = visibleRows.gap;
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
                const columnGap = visibleColumns.gap;
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

    bundleColumns(resetCellEvents = false) {
        const gridProps = this.gridProperties;

        if (resetCellEvents) {
            this.viewLayout.resetCellPoolWithColumnRowOrder()
        }

        const columnBundles = this.columnBundles;
        const gridPrefillColor = gridProps.backgroundColor;
        columnBundles.length = 0;

        this.viewLayoutColumns.forEach((vc) => {
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
                    columnBundles.push(bundle);
                }
            }
        });
    }

    bundleRows(resetCellEvents = false) {
        const gridProps = this.gridProperties;
        const R = this.viewLayoutRows.length

        if (resetCellEvents) {
            this.viewLayout.resetCellPoolWithRowColumnOrder();
        }

        const rowBundles = this.rowBundles;
        const gridPrefillColor = gridProps.backgroundColor;
        const rowStripes = gridProps.rowStripes;
        const rowPrefillColors = this.rowPrefillColors;

        rowBundles.length = 0;
        rowPrefillColors.length = R;

        for (let r = 0; r < R; r++) {
            const vr = this.viewLayoutRows[r]; // first cell in row r
            let backgroundColor: string;
            if (!vr.subgrid.isMain) {
                backgroundColor = gridPrefillColor;
            } else {
                if (rowStripes === undefined || rowStripes.length === 0) {
                    backgroundColor = gridPrefillColor;
                } else {
                    const stripe = rowStripes[vr.subgridRowIndex % rowStripes.length];
                    if (stripe === undefined) {
                        backgroundColor = gridPrefillColor;
                    } else {
                        backgroundColor = stripe.backgroundColor ?? gridPrefillColor;
                    }
                }
            }
            rowPrefillColors[r] = backgroundColor;
            let bundle: GridPainter.RowBundle | undefined;
            if (bundle !== undefined && bundle.backgroundColor === backgroundColor) {
                bundle.bottom = vr.bottom;
            } else {
                if (backgroundColor === gridPrefillColor) {
                    bundle = undefined;
                } else {
                    bundle = {
                        backgroundColor: backgroundColor,
                        top: vr.top,
                        bottom: vr.bottom
                    };
                    rowBundles.push(bundle);
                }
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
        resetAllGridPaintersEventer: ResetAllGridPaintersRequiredEventer,
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
}
