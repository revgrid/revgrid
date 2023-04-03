import { CanvasRenderingContext2DEx } from '../canvas/canvas-rendering-context-2d-ex';
import { CellPainterRepository } from '../cell-painter/cell-painter-repository';
import { BeingPaintedCell } from '../cell/being-painted-cell';
import { RenderedCell } from '../cell/rendered-cell';
import { Focus } from '../focus';
import { Point } from '../lib/point';
import { CellPaintConfig } from '../renderer/cell-paint-config';
import { Renderer } from '../renderer/renderer';
import { Revgrid } from '../revgrid';
import { Selection } from '../selection/selection';

export abstract class GridPainter {
    protected readonly grid: Revgrid;
    protected readonly focus: Focus;
    protected readonly visibleColumns: Renderer.VisibleColumnArray;
    protected readonly visibleRows: Renderer.VisibleRowArray;
    protected readonly renderedCellPool: BeingPaintedCell[];

    protected columnBundles = new Array<GridPainter.ColumnBundle | undefined>();
    protected rowBundles = new Array<GridPainter.RowBundle>();
    protected rowPrefillColors = new Array<string>();

    private readonly _cellPainterRepository: CellPainterRepository;

    reset = false;
    rebundle: boolean;

    constructor(
        protected readonly renderer: Renderer,
        protected readonly selection: Selection,
        public readonly key: string,
        public readonly partial: boolean,
        initialRebundle: boolean | undefined,
    ) {
        this.grid = renderer.grid;
        this.focus = this.grid.focus;
        this.visibleColumns = this.renderer.visibleColumns;
        this.visibleRows = this.renderer.visibleRows;
        this.renderedCellPool = this.renderer.renderedCellPool;
        this._cellPainterRepository = this.renderer.cellPainterRepository;

        if (initialRebundle !== undefined) {
            this.rebundle = initialRebundle;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    initialise() {

    }
    abstract paintCells(gc: CanvasRenderingContext2DEx): void;

    /**
     * @summary Render a single cell.
     * @param beingPaintedCell
     * @param prefillColor If omitted, this is a partial renderer; all other renderers must provide this.
     * @returns Preferred width of renndered cell.
     */
    protected paintCell(gc: CanvasRenderingContext2DEx, beingPaintedCell: BeingPaintedCell, config: CellPaintConfig, prefillColor: string | undefined): number | undefined {
        const grid = this.grid;
        const subgrid = beingPaintedCell.subgrid;
        const selection = grid.selection;
        const isMainRow = beingPaintedCell.isMainRow;

        const {
            rowSelected: isRowSelected,
            columnSelected: isColumnSelected,
            cellSelected: isCellSelected
        } = selection.getRowColumnCellSelected(subgrid, beingPaintedCell.gridCell.x, beingPaintedCell.dataCell.y);

        const isHeaderRow = beingPaintedCell.isHeaderRow;
        const isFilterRow = beingPaintedCell.isFilterRow;

        const x = (config.gridCell = beingPaintedCell.gridCell).x;
        const r = (config.dataCell = beingPaintedCell.dataCell).y;

        /* if (isHandleColumn) {
            isSelected = isRowSelected || selectionModel.isCellSelectedInRow(r);
            config.halign = 'right';
        } else if (isTreeColumn) {
            isSelected = isRowSelected || selectionModel.isCellSelectedInRow(r);
            config.halign = 'left';
        } else if (isMainRow) {
            isSelected = isCellSelected || isRowSelected || isColumnSelected;
        } else if (isFilterRow) {
            isSelected = false;
        } else if (isColumnSelected) {
            isSelected = true;
        } else {
            isSelected = selection.isCellSelectedInColumn(x); // header or summary or other non-meta
        }*/

        const isSelected = isCellSelected || isRowSelected || isColumnSelected;
        // Set cell contents:
        // * For all cells: set `config.value` (writable property)
        // * For cells outside of row handle column: also set `config.dataRow` for use by valOrFunc
        // * For non-data row tree column cells, do nothing (these cells render blank so value is undefined)
        // if (!isHandleColumn) {
            // including tree column
        config.dataRow = beingPaintedCell.dataRow;
        const value = beingPaintedCell.value;
        // } else if (isDataRow) {
            // row handle for a data row
            // if (config.rowHeaderNumbers) {
            //     value = r + 1; // row number is 1-based
            // }
        // } else
        if (isHeaderRow) {
            // row handle for header row: gets "master" checkbox
            config.allRowsSelected = selection.allRowsSelected;
        }

        config.isSelected = isSelected;
        config.isMainRow = isMainRow;
        config.isHeaderRow = isHeaderRow;
        config.isFilterRow = isFilterRow;
        config.isUserDataArea = isMainRow;
        config.isColumnHovered = beingPaintedCell.isColumnHovered;
        config.isRowHovered = beingPaintedCell.isRowHovered;
        config.bounds = beingPaintedCell.bounds;
        config.isCellHovered = beingPaintedCell.isCellHovered;
        config.isCellSelected = isCellSelected;
        config.isRowFocused = this.focus.isRowFocused(r);
        config.isRowSelected = isRowSelected;
        config.isColumnSelected = isColumnSelected;
        config.isInCurrentSelectionRectangle = selection.isInCurrentSelectionRectangle(x, r);
        config.prefillColor = prefillColor;

        if (grid.mouseDownState) {
            config.mouseDown = Point.isEqual(grid.mouseDownState.gridCell, beingPaintedCell.gridCell);
        }

        config.value = value;

        // This call's dataModel.getCell which developer can override to:
        // * mutate the (writable) properties of `config` (including config.value)
        // * mutate cell renderer choice (instance of which is returned)
        const cellPainter = beingPaintedCell.subgrid.getCellPainter(config, config.cellPainter);

        config.formatValue = grid.getFormatter(config.format);

        config.snapshot = beingPaintedCell.snapshot; // supports partial render
        const paintWidth = cellPainter.paint(gc, config);
        beingPaintedCell.snapshot = config.snapshot; // supports partial render

        if (paintWidth !== undefined) {
            if (beingPaintedCell.minWidth === undefined || paintWidth > beingPaintedCell.minWidth) {
                beingPaintedCell.minWidth = paintWidth;
            }
        }

        // Following supports clicking in a renderer-defined Rectangle of a cell (in the cell's local coordinates)
        beingPaintedCell.clickRect = config.clickRect;
        beingPaintedCell.cellPainter = cellPainter; // renderer actually used per getCell; used by fireSyntheticButtonPressedEvent

        return paintWidth;
    }

    paintErrorCell(err: Error, gc: CanvasRenderingContext2DEx, vc: Renderer.VisibleColumn, vr: Renderer.VisibleRow) {
        const message = (err && (err.message ?? `${err}`)) ?? 'Unknown error.';

        const bounds = { x: vc.left, y: vr.top, width: vc.width, height: vr.height };

        console.error(message);

        gc.cache.save(); // define clipping region
        gc.beginPath();
        gc.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        gc.clip();

        const cellPainter = this._cellPainterRepository.errorCellPainter;
        cellPainter.paintMessage(gc, bounds, message);

        gc.cache.restore(); // discard clipping region
    }

    /**
     * @desc We opted to not paint borders for each cell as that was extremely expensive. Instead we draw grid lines here.
     */
    paintGridlines(gc: CanvasRenderingContext2DEx) {
        const visibleColumns = this.visibleColumns;
        const C = visibleColumns.length;
        const visibleRows = this.visibleRows;
        const R = visibleRows.length;

        if (C && R) {
            const gridProps = this.grid.properties;
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
                const headerRowCount = this.grid.getHeaderRowCount();
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

    paintLastSelection(gc: CanvasRenderingContext2DEx, lastSelectionBounds: RenderedCell.Bounds) {
        // Render the selection model around the last selection bounds
        const gridProps = this.grid.properties;
        const config = {
            columnName: '',
            bounds: lastSelectionBounds,
            selectionRegionOverlayColor: this.partial ? 'transparent' : gridProps.selectionRegionOverlayColor,
            selectionRegionOutlineColor: gridProps.selectionRegionOutlineColor,
        } as CellPaintConfig;

        const lastSelectionRenderer = this._cellPainterRepository.lastSelectionCellPainter;
        lastSelectionRenderer.paint(gc, config);
    }

    bundleColumns(resetCellEvents = false) {
        const gridProps = this.grid.properties;

        if (resetCellEvents) {
            const R = this.visibleRows.length
            const pool = this.renderedCellPool;
            const visibleRows = this.visibleRows;
            let p = 0;
            this.visibleColumns.forEach((vc) => {
                for (let r = 0; r < R; r++, p++) {
                    const vr = visibleRows[r];
                    // reset pool member to reflect coordinates of cell in newly shaped grid
                    pool[p].reset(vc, vr);
                }
            });
        }

        const columnBundles = this.columnBundles;
        const gridPrefillColor = gridProps.backgroundColor;
        columnBundles.length = 0;

        this.visibleColumns.forEach((vc) => {
            let bundle: GridPainter.ColumnBundle | undefined;
            const backgroundColor = vc.column.properties.backgroundColor;
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
        const gridProps = this.grid.properties;
        const R = this.visibleRows.length

        if (resetCellEvents) {
            const pool = this.renderedCellPool;
            const visibleRows = this.visibleRows;
            for (let p = 0, r = 0; r < R; r++) {
                const vr = visibleRows[r];
                this.visibleColumns.forEach((vc) => { // eslint-disable-line no-loop-func
                    p++;
                    // reset pool member to reflect coordinates of cell in newly shaped grid
                    pool[p].reset(vc, vr);
                });
            }
        }

        const rowBundles = this.rowBundles;
        const gridPrefillColor = gridProps.backgroundColor;
        const rowStripes = gridProps.rowStripes;
        const rowPrefillColors = this.rowPrefillColors;

        rowBundles.length = 0;
        rowPrefillColors.length = R;

        for (let r = 0; r < R; r++) {
            const vr = this.visibleRows[r]; // first cell in row r
            let backgroundColor: string;
            if (!vr.subgrid.isMain) {
                backgroundColor = gridPrefillColor;
            } else {
                if (rowStripes === undefined || rowStripes.length === 0) {
                    backgroundColor = gridPrefillColor;
                } else {
                    const stripe = rowStripes[vr.rowIndex % rowStripes.length];
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
}

export namespace GridPainter {
    export type Constructor = new(renderer: Renderer, selection: Selection) => GridPainter;

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
