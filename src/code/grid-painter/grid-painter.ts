import { CanvasRenderingContext2DEx } from '../canvas/canvas-rendering-context-2d-ex';
import { CellPainter } from '../cell-painter/cell-painter';
import { Hypegrid } from '../grid/hypegrid';
import { Point } from '../lib/point';
import { CellPaintConfig } from '../renderer/cell-paint-config';
import { RenderCell } from '../renderer/render-cell';
import { Renderer } from '../renderer/renderer';

export abstract class GridPainter {
    protected readonly grid: Hypegrid;
    protected readonly visibleColumns: Renderer.VisibleColumnArray;
    protected readonly visibleRows: Renderer.VisibleRowArray;
    protected readonly renderCellPool: RenderCell[];

    protected columnBundles = new Array<GridPainter.ColumnBundle>();
    protected rowBundles = new Array<GridPainter.RowBundle>();
    protected rowPrefillColors = new Array<string>();

    reset = false;
    rebundle: boolean;

    constructor(
        protected readonly renderer: Renderer,
        public readonly key: string,
        public readonly partial: boolean,
        initialRebundle: boolean | undefined,
    ) {
        this.grid = renderer.grid;
        this.visibleColumns = this.renderer.visibleColumns;
        this.visibleRows = this.renderer.visibleRows;
        this.renderCellPool = this.renderer.renderCellPool;

        if (initialRebundle !== undefined) {
            this.rebundle = initialRebundle;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    initialise() {

    }
    abstract paint(gc: CanvasRenderingContext2DEx): void;

    /**
     * @summary Render a single cell.
     * @param renderCell
     * @param prefillColor If omitted, this is a partial renderer; all other renderers must provide this.
     * @returns Preferred width of renndered cell.
     */
    protected paintCell(gc: CanvasRenderingContext2DEx, renderCell: RenderCell, config: CellPaintConfig, prefillColor: string | undefined): number {
        const grid = this.grid;
        const selectionModel = grid.selectionModel;

        const isColumnSelected = renderCell.isColumnSelected;

        const isDataRow = renderCell.isDataRow;
        const isRowSelected = renderCell.isRowSelected;
        const isCellSelected = renderCell.isCellSelected;

        const isHeaderRow = renderCell.isHeaderRow;
        const isFilterRow = renderCell.isFilterRow;

        const x = (config.gridCell = renderCell.gridCell).x;
        const r = (config.dataCell = renderCell.dataCell).y;

        let isSelected: boolean;

        /* if (isHandleColumn) {
            isSelected = isRowSelected || selectionModel.isCellSelectedInRow(r);
            config.halign = 'right';
        } else if (isTreeColumn) {
            isSelected = isRowSelected || selectionModel.isCellSelectedInRow(r);
            config.halign = 'left';
        } else */ if (isDataRow) {
            isSelected = isCellSelected || isRowSelected || isColumnSelected;
        } else if (isFilterRow) {
            isSelected = false;
        } else if (isColumnSelected) {
            isSelected = true;
        } else {
            isSelected = selectionModel.isCellSelectedInColumn(x); // header or summary or other non-meta
        }

        // Set cell contents:
        // * For all cells: set `config.value` (writable property)
        // * For cells outside of row handle column: also set `config.dataRow` for use by valOrFunc
        // * For non-data row tree column cells, do nothing (these cells render blank so value is undefined)
        // if (!isHandleColumn) {
            // including tree column
        config.dataRow = renderCell.dataRow;
        const value = renderCell.value;
        // } else if (isDataRow) {
            // row handle for a data row
            // if (config.rowHeaderNumbers) {
            //     value = r + 1; // row number is 1-based
            // }
        // } else
        if (isHeaderRow) {
            // row handle for header row: gets "master" checkbox
            config.allRowsSelected = selectionModel.areAllRowsSelected();
        }

        config.isSelected = isSelected;
        config.isDataRow = isDataRow;
        config.isHeaderRow = isHeaderRow;
        config.isFilterRow = isFilterRow;
        config.isUserDataArea = isDataRow;
        config.isColumnHovered = renderCell.isColumnHovered;
        config.isRowHovered = renderCell.isRowHovered;
        config.bounds = renderCell.bounds;
        config.isCellHovered = renderCell.isCellHovered;
        config.isCellSelected = isCellSelected;
        config.isRowSelected = isRowSelected;
        config.isColumnSelected = isColumnSelected;
        config.isInCurrentSelectionRectangle = selectionModel.isInCurrentSelectionRectangle(x, r);
        config.prefillColor = prefillColor;

        if (grid.mouseDownState) {
            config.mouseDown = Point.isEqual(grid.mouseDownState.gridCell, renderCell.gridCell);
        }

        config.subrow = 0;
        let subrows: number;

        const bounds = config.bounds = Object.assign({}, config.bounds);

        // subrow logic - coded for efficiency when no subrows (!value.subrows)
        if (isDataRow && Array.isArray(value)) {
            const subrowsValue = value as Renderer.SubrowsValue;
            if ('subrows' in subrowsValue) {
                subrows = value.length;
                bounds.height /= subrows;
                config.subrows = subrows;
                // config.value = config.exec(value[0]);
                config.value = value[0];
            } else {
                subrows = 1;
                config.value = value;
            }
        } else {
            subrows = 1;
            // config.value = isUserDataArea ? config.exec(value) : value;
            config.value = value;
        }

        let cellPainter: CellPainter | undefined;

        while (true) { // eslint-disable-line
            // This call's dataModel.getCell which developer can override to:
            // * mutate the (writable) properties of `config` (including config.value)
            // * mutate cell renderer choice (instance of which is returned)
            cellPainter = renderCell.subgrid.getCellPainter(config, config.renderer);

            config.formatValue = grid.getFormatter(config.format);

            config.snapshot = renderCell.snapshot[config.subrow]; // supports partial render

            config.minWidth = renderCell.minWidth; // in case `paint` aborts before setting `minWidth`

            // Render the cell
            // if (cellRenderer.forEach) {
            //     cellRenderer.forEach((subrenderer) => {
            //         subrenderer.paint(gc, config);
            //     });
            // } else {
                cellPainter.paint(gc, config);
            // }

            renderCell.snapshot[config.subrow] = config.snapshot; // supports partial render

            if (renderCell.minWidth === undefined || config.minWidth > renderCell.minWidth) {
                renderCell.minWidth = config.minWidth;
            }

            if (++config.subrow === subrows) {
                break;
            }

            bounds.y += bounds.height;
            config.value = config.value[config.subrow];
        }

        // Following supports clicking in a renderer-defined Rectangle of a cell (in the cell's local coordinates)
        renderCell.clickRect = config.clickRect;
        renderCell.cellPainter = cellPainter; // renderer actually used per getCell; used by fireSyntheticButtonPressedEvent

        return config.minWidth;
    }

    bundleColumns(resetCellEvents = false) {
        const gridProps = this.grid.properties;

        if (resetCellEvents) {
            const R = this.visibleRows.length
            const pool = this.renderCellPool;
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

        let bundle: GridPainter.ColumnBundle;
        const columnBundles = this.columnBundles;
        const gridPrefillColor = gridProps.backgroundColor;
        columnBundles.length = 0;

        this.visibleColumns.forEach((vc) => {
            const backgroundColor = vc.column.properties.backgroundColor;
            if (bundle && bundle.backgroundColor === backgroundColor) {
                bundle.right = vc.rightPlus1;
            } else if (backgroundColor === gridPrefillColor) {
                bundle = undefined;
            } else {
                bundle = {
                    backgroundColor: backgroundColor,
                    left: vc.left,
                    right: vc.rightPlus1
                };
                columnBundles.push(bundle);
            }
        });
    }

    bundleRows(resetCellEvents = false) {
        const gridProps = this.grid.properties;
        const R = this.visibleRows.length

        if (resetCellEvents) {
            const pool = this.renderCellPool;
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

        let bundle: GridPainter.RowBundle;
        const rowBundles = this.rowBundles;
        const gridPrefillColor = gridProps.backgroundColor;
        const rowStripes = gridProps.rowStripes;
        const rowPrefillColors = this.rowPrefillColors;

        rowBundles.length = 0;
        rowPrefillColors.length = 0;

        for (let r = 0; r < R; r++) {
            const vr = this.visibleRows[r]; // first cell in row r
            let backgroundColor: string;
            if (!vr.subgrid.isData) {
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
            if (bundle && bundle.backgroundColor === backgroundColor) {
                bundle.bottom = vr.bottom;
            } else if (backgroundColor === gridPrefillColor) {
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

export namespace GridPainter {
    export type Constructor = new(renderer: Renderer) => GridPainter;

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
