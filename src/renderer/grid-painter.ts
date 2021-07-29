import { CellPainter } from '../cell-painter/cell-painter';
import { RenderCellPropertiesAccessor } from '../cell-painter/render-cell-properties-accessor';
import { Point } from '../dependencies/point';
import { Hypergrid } from '../grid/hypergrid';
import { CanvasRenderingContext2DEx } from '../lib/canvas-rendering-context-2d-ex';
import { RenderCell } from '../lib/render-cell';
import { Renderer } from './renderer';

export abstract class GridPainter {
    protected readonly grid: Hypergrid;
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
    protected paintCell(gc: CanvasRenderingContext2DEx, renderCell: RenderCell, prefillColor: string | undefined): number {
        const grid = this.grid;
        const selectionModel = grid.selectionModel;

        const isHandleColumn = renderCell.isHandleColumn;
        const isTreeColumn = renderCell.isTreeColumn;
        const isColumnSelected = renderCell.isColumnSelected;

        const isDataRow = renderCell.isDataRow;
        const isRowSelected = renderCell.isRowSelected;
        const isCellSelected = renderCell.isCellSelected;

        const isHeaderRow = renderCell.isHeaderRow;
        const isFilterRow = renderCell.isFilterRow;

        const isRowHandleOrHierarchyColumn = isHandleColumn || isTreeColumn;
        const isUserDataArea = !isRowHandleOrHierarchyColumn && isDataRow;

        const config: CellPainter.Config = new RenderCellPropertiesAccessor(renderCell.column.properties, renderCell.grid.properties);

        const x = (config.gridCell = renderCell.gridCell).x;
        const r = (config.dataCell = renderCell.dataCell).y;

        let value: number | unknown | Renderer.SubrowsValue;
        let isSelected: boolean;

        if (isHandleColumn) {
            isSelected = isRowSelected || selectionModel.isCellSelectedInRow(r);
            config.halign = 'right';
        } else if (isTreeColumn) {
            isSelected = isRowSelected || selectionModel.isCellSelectedInRow(r);
            config.halign = 'left';
        } else if (isDataRow) {
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
        if (!isHandleColumn) {
            // including tree column
            config.dataRow = renderCell.dataRow;
            value = renderCell.value;
        } else if (isDataRow) {
            // row handle for a data row
            if (config.rowHeaderNumbers) {
                value = r + 1; // row number is 1-based
            }
        } else if (isHeaderRow) {
            // row handle for header row: gets "master" checkbox
            config.allRowsSelected = selectionModel.areAllRowsSelected();
        }

        config.isSelected = isSelected;
        config.isDataColumn = !isRowHandleOrHierarchyColumn;
        config.isHandleColumn = isHandleColumn;
        config.isTreeColumn = isTreeColumn;
        config.isDataRow = isDataRow;
        config.isHeaderRow = isHeaderRow;
        config.isFilterRow = isFilterRow;
        config.isUserDataArea = isUserDataArea;
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
        if (isUserDataArea && Array.isArray(value)) {
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

        let cellRenderer: CellPainter | undefined;

        while (true) { // eslint-disable-line
            // This call's dataModel.getCell which developer can override to:
            // * mutate the (writable) properties of `config` (including config.value)
            // * mutate cell renderer choice (instance of which is returned)
            cellRenderer = renderCell.subgrid.getCell(config, config.renderer);

            config.formatValue = grid.getFormatter(config.format);

            config.snapshot = renderCell.snapshot[config.subrow]; // supports partial render

            config.minWidth = renderCell.minWidth; // in case `paint` aborts before setting `minWidth`

            // Render the cell
            // if (cellRenderer.forEach) {
            //     cellRenderer.forEach((subrenderer) => {
            //         subrenderer.paint(gc, config);
            //     });
            // } else {
                cellRenderer.paint(gc, config);
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
        renderCell.cellRenderer = cellRenderer; // renderer actually used per getCell; used by fireSyntheticButtonPressedEvent

        return config.minWidth;
    }

    bundleColumns(resetCellEvents = false) {
        const gridProps = this.grid.properties;

        if (resetCellEvents) {
            const R = this.visibleRows.length
            const pool = this.renderCellPool;
            const visibleRows = this.visibleRows;
            let p = 0;
            this.visibleColumns.forEachWithNeg((vc) => {
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

        this.visibleColumns.forEachWithNeg((vc) => {
            const backgroundColor = vc.column.properties.backgroundColor;
            if (bundle && bundle.backgroundColor === backgroundColor) {
                bundle.right = vc.right;
            } else if (backgroundColor === gridPrefillColor) {
                bundle = undefined;
            } else {
                bundle = {
                    backgroundColor: backgroundColor,
                    left: vc.left,
                    right: vc.right
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
                this.visibleColumns.forEachWithNeg((vc) => { // eslint-disable-line no-loop-func
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
            const stripe = vr.subgrid.isData && rowStripes && rowStripes[vr.rowIndex % rowStripes.length];
            const backgroundColor = (stripe && stripe.backgroundColor) ?? gridPrefillColor;
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


export type GridPainterConstructor = new(renderer: Renderer) => GridPainter;
