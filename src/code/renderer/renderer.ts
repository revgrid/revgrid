import { CanvasRenderingContext2DEx } from '../canvas/canvas-rendering-context-2d-ex';
import { CellPainter } from '../cell-painter/cell-painter';
import { CellPainterRepository } from '../cell-painter/cell-painter-repository';
import { ErrorCellPainter } from '../cell-painter/error-cell-painter';
import { LastSelectionCellPainter } from '../cell-painter/last-selection-cell-painter';
import { Column } from '../column/column';
import { GridPainter } from '../grid-painter/grid-painter';
import { GridPainterRepository } from '../grid-painter/grid-painter-repository';
import { Hypegrid } from '../grid/hypegrid';
import { Subgrid } from '../grid/subgrid';
import { AssertError } from '../lib/hypegrid-error';
import { InclusiveRectangle } from '../lib/inclusive-rectangle';
import { Point } from '../lib/point';
import { Rectangle, RectangleInterface } from '../lib/rectangular';
import { CellInfo } from './cell-info';
import { CellPaintConfig } from './cell-paint-config';
import { RenderCell } from './render-cell';


/** CanvasRenderingContext2D
 * {@link https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D|CanvasRenderingContext2D}
 */


/**
 * @desc fin-hypergrid-renderer is the canvas enabled top level sub component that handles the renderering of the Grid.
 *
 * It relies on two other external subprojects
 *
 * 1. fin-canvas: a wrapper to provide a simpler interface to the HTML5 canvas component
 * 2. rectangular: a small npm module providing Point and Rectangle objects
 *
 * The fin-hypergrid-renderer is in a unique position to provide critical functionality to the fin-hypergrid in a hightly performant manner.
 * Because it MUST iterate over all the visible cells it can store various bits of information that can be encapsulated as a service for consumption by the fin-hypergrid component.
 *
 * Instances of this object have basically four main functions.
 *
 * 1. render fixed row headers
 * 2. render fixed col headers
 * 3. render main data cells
 * 4. render grid lines
 *
 * Same parameters as {@link Renderer#initialize|initialize}, which is called by this constructor.
 *
 */
export class Renderer {
    private readonly gridPainterRepository: GridPainterRepository;
    readonly cellPainterRepository: CellPainterRepository;
    /**
     * Represents the ordered set of visible columns. Array size is always the exact number of visible columns, the last of which may only be partially visible.
     *
     * This sequence of elements' `columnIndex` values assumes one of three patterns. Which pattern is base on the following two questions:
     * * Are there "fixed" columns on the left?
     * * Is the grid horizontally scrolled?
     *
     * The set of `columnIndex` values consists of:
     * 1. The first element will be -1 if the row handle column is being rendered.
     * 2. A zero-based list of consecutive of integers representing the fixed columns (if any).
     * 3. An n-based list of consecutive of integers representing the scrollable columns (where n = number of fixed columns + the number of columns scrolled off to the left).
     */
    visibleColumns: Renderer.VisibleColumnArray;

    /**
     * Represents the ordered set of visible rows. Array size is always the exact number of visible rows.
     *
     * The sequence of elements' `rowIndex` values is local to each subgrid.
     * * **For each non-scrollable subgrid:** The sequence is a zero-based list of consecutive integers.
     * * **For the scrollable subgrid:**
     *   1. A zero-based list of consecutive of integers representing the fixed rows (if any).
     *   2. An n-based list of consecutive of integers representing the scrollable rows (where n = number of fixed rows + the number of rows scrolled off the top).
     *
     * Note that non-scrollable subgrids can come both before _and_ after the scrollable subgrid.
     */
    visibleRows = new Renderer.VisibleRowArray();

    visibleColumnsByIndex = new Array<Renderer.VisibleColumn>();  // array because number of columns will always be reasonable
    visibleRowsByDataRowIndex = new Map<number, Renderer.VisibleRow>(); // hash because keyed by (fixed and) scrolled row indexes

    // I don't think this is used
    insertionBounds = new Array<number>();

    lastKnowRowCount: number | undefined;
    needsComputeCellsBounds = false;

    dataWindow: InclusiveRectangle;

    bounds: Renderer.Bounds;

    // Specifies the index of the column anchored to the bounds edge
    // Will be first non-fixed visible column or last visible column depending on the gridRightAligned property
    // Set to -1 if there is no space scrollable columns (ie only space for fixed columns)
    private _scrollAnchorColumnIndex: number;
    // Specifies the number of pixels of the anchored column which have been scrolled off the viewport
    private _scrollAnchorColumnOffset: number;

    // Column Index at other end of viewport
    private _scrollOppositeAnchorColumnIndex: number;

    private gridPainter: GridPainter;

    //the shared single item "pooled" cell object for drawing each cell
    private cell = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    }

    private scrollHeight = 0;
    renderCellPool = new Array<RenderCell>();

    get scrollAnchorColumnIndex() { return this._scrollAnchorColumnIndex; }
    get scrollAnchorColumnOffset() { return this._scrollAnchorColumnOffset; }
    get scrollOppositeAnchorColumnIndex() { return this._scrollOppositeAnchorColumnIndex; }

    /**
     * @summary Constructor logic
     * @desc This method will be called upon instantiation of this class or of any class that extends from this class.
     * > All `initialize()` methods in the inheritance chain are called, in turn, each with the same parameters that were passed to the constructor, beginning with that of the most "senior" class through that of the class of the new instance.
     */
    constructor(readonly grid: Hypegrid) {
        this.gridPainterRepository = new GridPainterRepository();
        this.cellPainterRepository = new CellPainterRepository();

        this.visibleColumns = new Renderer.VisibleColumnArray();



        this.setGridPainter(this.properties.gridPainter);

        this.reset();
    }

    reset() {
        this.bounds = {
            width: 0,
            height: 0
        };

        this.visibleColumns.length = 0;
        this.visibleRows.length = 0;

        this.insertionBounds.length = 0;

        this.renderCellPool.length = 0;

        this.resetScrollAnchor();
    }


    registerGridPainter(key: string, constructor: GridPainter.Constructor) {
        this.gridPainterRepository.register(key, constructor);
    }

    getGridPainter(key: string) {
        return this.gridPainterRepository.get(this, key);
    }

    setGridPainter(key: string) {
        const gridPainter = this.gridPainterRepository.get(this, key);

        if (!gridPainter) {
            throw new AssertError('RSGP68240', 'Unregistered grid renderer "' + key + '"');
        }

        if (gridPainter !== this.gridPainter) {
            this.gridPainter = gridPainter;
            this.gridPainter.reset = true;
        }
    }

    resetAllGridRenderers(blackList?: string[]) {
        // Notify renderers that grid shape has changed
        const all = this.gridPainterRepository.allCreatedEntries();
        for (const [key, value] of all) {
            value.reset = !blackList || blackList.indexOf(key) < 0;
        }
    }

    /**
     * Certain renderers that pre-bundle column rects based on columns' background colors need to re-bundle when columns' background colors change. This method sets the `rebundle` property to `true` for those renderers that have that property.
     */
    rebundleGridRenderers() {
        const all = this.gridPainterRepository.allCreated();
        for (const value of all) {
            if (value.rebundle !== undefined) {
                value.rebundle = true;
            }
        }
    }

    registerCellPainter(typeName: string, constructor: CellPainter.Constructor) {
        this.cellPainterRepository.register(typeName, constructor);
    }

    resetScrollAnchor() {
        this._scrollAnchorColumnIndex = this.grid.getFixedColumnCount();
        this._scrollOppositeAnchorColumnIndex = this._scrollAnchorColumnIndex;
        this._scrollAnchorColumnOffset = 0;
    }

    updateColumnScrollAnchor(viewportStart: number, viewportFinish: number, contentStart: number, contentFinish: number): boolean {
        const { index, offset } = this.calculateColumnScrollAnchor(viewportStart, viewportFinish, contentStart, contentFinish);
        if (index === this._scrollAnchorColumnIndex && offset === this._scrollAnchorColumnOffset) {
            return false;
        } else {
            this._scrollAnchorColumnIndex = index;
            this._scrollAnchorColumnOffset = offset;
            return true;
        }
    }

    calculateColumnScrollAnchor(viewportStart: number, viewportFinish: number, contentStart: number, contentFinish: number): CalculatedScrollAnchor {
        const columnCount = this.grid.getColumnCount();
        const fixedColumnCount = this.grid.getFixedColumnCount();
        const gridProps = this.grid.properties;
        const gridLinesVWidth = gridProps.gridLinesVWidth;
        const gridRightAligned = gridProps.gridRightAligned;
        const scrollHorizontallySmoothly = gridProps.scrollHorizontallySmoothly;

        if (gridRightAligned) {
            if (viewportFinish >= contentFinish) {
                return {
                    index: columnCount - 1,
                    offset: 0
                };
            } else {
                let prevColumnLeft = contentFinish;
                let columnLeft: number;
                let lastColumnDone = false;
                for (let i = columnCount - 1; i >= fixedColumnCount; i--) {
                    columnLeft = prevColumnLeft - this.grid.getColumnWidth(i);
                    if (lastColumnDone) {
                        columnLeft -= gridLinesVWidth;
                    } else {
                        lastColumnDone = true;
                    }

                    if (viewportFinish < columnLeft) {
                        prevColumnLeft = columnLeft;
                    } else {
                        let offset: number;
                        if (!scrollHorizontallySmoothly) {
                            offset = 0;
                        } else {
                            offset = Math.ceil(prevColumnLeft - viewportFinish - 1);
                        }
                        return {
                            index: i,
                            offset,
                        };
                    }
                }
                return {
                    index: -1,
                    offset: 0,
                };
            }
        } else {
            let left = contentStart;
            let nextLeft: number;
            for (let i = fixedColumnCount; i < columnCount; i++) {
                nextLeft = this.grid.getColumnWidth(i) + gridLinesVWidth + left;
                if (viewportStart > nextLeft) {
                    left = nextLeft;
                } else {
                    let index: number;
                    if (viewportStart === nextLeft) {
                        index = i + 1;
                        left = nextLeft;
                    } else {
                        index = i;
                    }
                    let offset: number;
                    if (!scrollHorizontallySmoothly) {
                        offset = 0;
                    } else {
                        offset = Math.ceil(viewportStart - left);
                    }
                    return {
                        index,
                        offset
                    };
                }
            }

            let index: number;
            if (columnCount === fixedColumnCount) {
                index = -1;
            } else {
                index = columnCount -1;
            }
            return {
                index,
                offset: 0,
            };
        }
    }

    calculateColumnScrollAnchorViewportStart(contentStart: number) {
        const gridLinesVWidth = this.grid.properties.gridLinesVWidth;
        const columnCount = this.grid.getColumnCount();
        const fixedColumnCount = this.grid.getFixedColumnCount();
        const scrollAnchorColumnIndex = this._scrollAnchorColumnIndex;
        let result = contentStart;
        for (let i = fixedColumnCount; i < columnCount; i++) {
            if (i === scrollAnchorColumnIndex) {
                break;
            } else {
                result += (this.grid.getColumnWidth(i) + gridLinesVWidth);
            }
        }

        result += this._scrollAnchorColumnOffset;

        return result;
    }

    calculateColumnScrollAnchorViewportFinish(contentFinish: number) {
        const gridLinesVWidth = this.grid.properties.gridLinesVWidth;
        const columnCount = this.grid.getColumnCount();
        const fixedColumnCount = this.grid.getFixedColumnCount();
        const scrollAnchorColumnIndex = this._scrollAnchorColumnIndex;
        let result = contentFinish;
        for (let i = columnCount - 1; i > fixedColumnCount; i--) {
            if (i === scrollAnchorColumnIndex) {
                break;
            } else {
                result -= this.grid.getColumnWidth(i);
            }
        }

        if (gridLinesVWidth > 0) {
            const anchorColumnCount = columnCount - scrollAnchorColumnIndex;
            if (anchorColumnCount > 1) {
                result -= (anchorColumnCount - 1) * gridLinesVWidth;
            }
        }

        result -= this._scrollAnchorColumnOffset;

        return result;
    }

    computeCellsBounds(immediate = false) {
        if (immediate) {
            this.internalComputeCellsBounds();
            this.needsComputeCellsBounds = false;
        } else {
            this.needsComputeCellsBounds = true;
        }
    }

    /**
     * CAUTION: Keep in place! Used by {@link Canvas}.
     * @returns The current grid properties object.
     */
    get properties() {
        return this.grid.properties;
    }

    /**
     * @summary Notify the fin-hypergrid every time we've repainted.
     * @desc This is the entry point from fin-canvas.
     */
    paint(gc: CanvasRenderingContext2DEx) {
        if (this.grid.canvas) {
            this.renderGrid(gc);
            this.grid.gridRenderedNotification();
        }
    }

    tickNotification() {
        this.grid.tickNotification();
    }

    /**
     * @returns Answer how many rows we rendered
     */
    getVisibleRowsCount() {
        // This looks wrong.  It is not used within library - best to ignore
        return this.visibleRows.length - 1;
    }

    getVisibleScrollHeight() {
        const footerHeight = this.grid.properties.defaultRowHeight * this.grid.behavior.getFooterRowCount();
        return this.getBounds().height - footerHeight - this.grid.getFixedRowsHeight();
    }

    /**
     * @returns Number of columns we just rendered.
     */
    getVisibleColumnsCount() {
        // This looks wrong.  It is not used within library - best to ignore
        return this.visibleColumns.length - 1;
    }

    /**
     * @param x - Grid column coordinate.
     * @param y - Grid row coordinate.
     * @returns Bounding rect of cell with the given coordinates.
     */
    getBoundsOfCell(x: number, y: number): RectangleInterface {
        const vc = this.visibleColumns[x];
        const vr = this.visibleRows[y];

        return {
            x: vc.left,
            y: vr.top,
            width: vc.width,
            height: vr.height
        };
    }

    /**
     * @desc answer the column index under the coordinate at pixelX
     * @param pixelX - The horizontal coordinate.
     * @returns The column index under the coordinate at pixelX.
     */
    getColumnFromPixelX(pixelX: number): number {
        let width = 0;
        const fixedColumnCount = this.grid.getFixedColumnCount();
        const scrollLeft = this.grid.getHScrollViewportStartColumnIndex();
        const visibleColumns = this.visibleColumns;

        let c = 1;
        while (c < visibleColumns.length - 1) {
            width = visibleColumns[c].left - (visibleColumns[c].left - visibleColumns[c - 1].left) / 2;
            if (pixelX < width) {
                if (c > fixedColumnCount) {
                    c += scrollLeft;
                }
                return c - 1;
            }
            c++;
        }
        if (c > fixedColumnCount) {
            c += scrollLeft;
        }
        return c - 1;
    }


    /**
     * @desc Answer specific data cell coordinates given mouse coordinates in pixels.
     * @param point
     * @returns Cell coordinates
     */
    getGridCellFromMousePoint(point: Point): Renderer.GetGridCellFromMousePointResult {
        const x = point.x;
        const y = point.y;
        let isPseudoRow: boolean;
        let isPseudoCol: boolean;
        const vrs = this.visibleRows;
        const vcs = this.visibleColumns;
        const firstColumn = vcs[0];
        const inFirstColumn = firstColumn && x < firstColumn.rightPlus1;
        let vc = inFirstColumn ? firstColumn : vcs.find((vc) => { return x < vc.rightPlus1; });
        let vr = vrs.find(function(vr) { return y < vr.bottom; });
        let fake = false;

        //default to last row and col
        if (vr) {
            isPseudoRow = false;
        } else {
            vr = vrs[vrs.length - 1];
            isPseudoRow = true;
        }

        if (vc) {
            isPseudoCol = false;
        } else {
            vc = vcs[vcs.length - 1];
            isPseudoCol = true;
        }

        let renderCell: RenderCell;
        if (vc !== undefined) {
            renderCell = new RenderCell(this.grid, vc.columnIndex, vr.index);
            const renderCellFromPool = this.findCell(renderCell);
            renderCell = renderCellFromPool ? Object.create(renderCellFromPool) : renderCell;
            renderCell.mousePoint = this.grid.newPoint(x - vc.left, y - vr.top);
        }

        if (isPseudoCol || isPseudoRow) {
            fake = true;
            this.grid.beCursor(null);
        }

        return {
            cellInfo: renderCell,
            fake
        }
    }

    /**
     * Matrix of unformatted values of visible cells.
     */
    getVisibleCellMatrix(): Array<Array<unknown>> {
        const rows = Array(this.visibleRows.length);
        for (let y = 0; y < rows.length; ++y) {
            rows[y] = Array(this.visibleColumns.length);
        }

        this.renderCellPool.forEach((cell) => {
            const x = cell.gridCell.x;
            if (x >= 0) {
                rows[cell.gridCell.y][x] = cell.value;
            }
        });
        return rows;
    }

    /**
     * @summary Get the visibility of the column matching the provided grid column index.
     * @desc Requested column may not be visible due to being scrolled out of view.
     * @summary Determines if a column is visible.
     * @param columnIndex - the column index
     * @returns The given column is visible.
     */
    isColumnVisible(columnIndex: number) {
        return !!this.getVisibleColumn(columnIndex);
    }

    /**
     * @summary Get the "visible column" object matching the provided grid column index.
     * @desc Requested column may not be visible due to being scrolled out of view.
     * @summary Find a visible column object.
     * @param columnIndex - The grid column index.
     * @returns The given column if visible or `undefined` if not.
     */
    getVisibleColumn(columnIndex: number) {
        return this.visibleColumns.find(
            (vc) => {
                return vc.columnIndex === columnIndex;
            }
        );
    }

    /**
     * @desc Calculate the minimum left column index so the target column shows up in viewport (we need to be aware of viewport's width, number of fixed columns and each column's width)
     * @param targetColIdx - Target column index
     * @returns Minimum left column index so target column shows up
     */
    getMinimumLeftPositionToShowColumn(targetColIdx: number) {
        const fixedColumnCount = this.grid.getFixedColumnCount();
        let fixedColumnsWidth = 0;
        let viewportWidth = 0;
        // let leftColIdx = 0;
        let targetRight = 0;
        let lastFixedColumn = null;
        const computedCols = [];
        let col = null;
        let left = 0;
        let right = 0;


        // 1) for each column, we'll compute left and right position in pixels (until target column)
        for (let i = 0; i <= targetColIdx; i++) {
            left = right;
            right += Math.ceil(this.grid.getColumnWidth(i));

            computedCols.push({
                left: left,
                right: right
            });
        }

        targetRight = computedCols[computedCols.length - 1].right;

        // 2) calc usable viewport width
        lastFixedColumn = computedCols[fixedColumnCount - 1];

        fixedColumnsWidth = lastFixedColumn ? lastFixedColumn.right : 0;
        viewportWidth = this.getBounds().width - fixedColumnsWidth;

        // 3) from right to left, find the last column that can still render target column
        let i = targetColIdx;

        do {
            // leftColIdx = i;
            col = computedCols[i];
            i--;
        } while (col.left + viewportWidth > targetRight && i >= 0);

        return col.left;
        // return leftColIdx;
    }

    /**
     * @summary Get the visibility of the column matching the provided data column index.
     * @desc Requested column may not be visible due to being scrolled out of view or if the column is inactive.
     * @summary Determines if a column is visible.
     * @param columnIndex - the column index
     */
    isDataColumnVisible(columnIndex: number) {
        return !!this.getVisibleDataColumn(columnIndex);
    }

    /**
     * @summary Get the "visible column" object matching the provided data column index.
     * @desc Requested column may not be visible due to being scrolled out of view or if the column is inactive.
     * @summary Find a visible column object.
     * @param columnIndex - The grid column index.
     */
    getVisibleDataColumn(columnIndex: number) {
        return this.visibleColumns.find((vc) => {
            return vc.column.index === columnIndex;
        });
    }

    /**
     * @returns The width x coordinate of the last rendered column
     */
    getFinalVisibleColumnBoundary() {
        const chop = this.isLastColumnVisible() ? 2 : 1;
        const colWall = this.visibleColumns[this.visibleColumns.length - chop].rightPlus1;
        return Math.min(colWall, this.getBounds().width);
    }

    /**
     * @summary Get the visibility of the row matching the provided grid row index.
     * @desc Requested row may not be visible due to being outside the bounds of the rendered grid.
     * @summary Determines visibility of a row.
     * @param rowIndex - The grid row index.
     * @returns The given row is visible.
     */
    isRowVisible(rowIndex: number) {
        return !!this.visibleRows[rowIndex];
    }

    /**
     * @summary Get the "visible row" object matching the provided grid row index.
     * @desc Requested row may not be visible due to being outside the bounds of the rendered grid.
     * @summary Find a visible row object.
     * @param rowIndex - The grid row index.
     * @returns The given row if visible or `undefined` if not.
     */
    getVisibleRow(rowIndex: number) {
        return this.visibleRows[rowIndex];
    }

    /**
     * @summary Get the visibility of the row matching the provided data row index.
     * @desc Requested row may not be visible due to being scrolled out of view.
     * @summary Determines visibility of a row.
     * @param rowIndex - The data row index.
     * @returns The given row is visible.
     */
    isDataRowVisible(rowIndex: number, subgrid?: Subgrid): boolean {
        return this.getVisibleDataRow(rowIndex, subgrid) !== undefined;
    }

    /**
     * @summary Get the "visible row" object matching the provided data row index.
     * @desc Requested row may not be visible due to being scrolled out of view.
     * @summary Find a visible row object.
     * @param rowIndex - The data row index within the given subgrid.
     * @returns The given row if visible or `undefined` if not.
     */
    getVisibleDataRow(rowIndex: number, subgrid?: Subgrid) {
        if (subgrid === undefined) {
            subgrid = this.grid.behavior.mainSubgrid;
        }
        return this.visibleRows.find(
            (vr) => {
                return vr.subgrid === subgrid && vr.rowIndex === rowIndex;
            }
        );
    }

    /**
     * @summary Determines if a cell is selected.
     * @param x - the x cell coordinate
     * @param y - the y cell coordinate*
     * @returns The given cell is fully visible.
     */
    isSelected(x: number, y: number) {
        return this.grid.isSelected(x, y);
    }

    /**
     * @desc This is the main forking of the renderering task.
     *
     * `dataModel.fetchData` callback renders the grid. Note however that this is not critical when the clock is
     * running as it will be rendered on the next tick. We let it call it anyway in case (1) fetch returns quickly
     * enough to be rendered on this tick rather than next or (2) clock isn't running (for debugging purposes).
     * @param gc
     * @this {RendererType}
     */
    renderGrid(gc: CanvasRenderingContext2DEx) {
        const grid = this.grid;

        grid.deferredBehaviorChange();

        const rowCount = grid.getRowCount();
        if (rowCount !== this.lastKnowRowCount) {
            /*var newWidth = */ // this.renderResetRowHeaderColumnWidth(gc, rowCount);
            // if (newWidth !== this.handleColumnWidth) {
                this.needsComputeCellsBounds = true;
            //     this.handleColumnWidth = newWidth;
            // }
            this.lastKnowRowCount = rowCount;
        }

        if (this.needsComputeCellsBounds) {
            this.internalComputeCellsBounds();
            this.needsComputeCellsBounds = false;

            // Pre-fetch data if supported by data model
            if (grid.behavior.mainDataModel.fetchData) {
                grid.behavior.mainDataModel.fetchData(this.getSubrects(), (failure) => this.fetchCompletion(gc, failure));
                return; // skip refresh renderGrid call below
            }
        }

        this.gridPainter.paint(gc);
        this.renderOverrides(gc);
        this.renderLastSelection(gc);
    }

    renderLastSelection(gc: CanvasRenderingContext2DEx) {
        let selection: Rectangle;
        let left: number;
        let top: number;
        let width: number;
        let height: number;
        const grid = this.grid;
        const gridProps = grid.properties;
        const sm = grid.selectionModel;

        switch (sm.getLastSelectionType()) {
            case 'column':
                const columnSelections = sm.columnSelectionModel.selection;
                const lastColumnSelection = columnSelections[columnSelections.length - 1];

                left = lastColumnSelection[0];
                top = 0;
                width = lastColumnSelection[1] - left + 1;
                height = grid.getRowCount();
                selection = new InclusiveRectangle(left, top, width, height);
                break;

            case 'row':
                if (!(gridProps.collapseCellSelections && sm.getLastSelectionType(1) === 'cell')) {
                    const rowSelections = sm.rowSelectionModel.selection;
                    const lastRowSelection = rowSelections[rowSelections.length - 1];

                    left = 0;
                    top = lastRowSelection[0];
                    width = grid.behavior.getActiveColumns().length;
                    height = lastRowSelection[1] - top + 1;
                    selection = new InclusiveRectangle(left, top, width, height);
                } else {
                    selection = sm.getLastSelection();
                }
                break;

            case 'cell':
                selection = sm.getLastSelection();
                break;
        }

        if (!selection) {
            return; // no selection
        }

        // todo not sure what this is for; might be defunct logic
        if (selection.origin.x === -1) {
            // no selected area, lets exit
            return;
        }

        let vc: Renderer.VisibleColumn;
        const vci = this.visibleColumnsByIndex;
        let vr: Renderer.VisibleRow;
        const vri = this.visibleRowsByDataRowIndex;
        const lastScrollableColumn = this.visibleColumns[this.visibleColumns.length - 1]; // last column in scrollable section
        const lastScrollableRow = this.visibleRows[this.visibleRows.length - 1]; // last row in scrollable data section
        const firstScrollableColumn = vci[this.dataWindow.origin.x];
        const firstScrollableRow = vri.get(this.dataWindow.origin.y);
        const fixedColumnCount = gridProps.fixedColumnCount;
        const fixedRowCount = gridProps.fixedRowCount;
        const headerRowCount = grid.getHeaderRowCount();

        if (
            // entire selection scrolled out of view to left of visible columns; or
            (vc = this.visibleColumns[0]) &&
            selection.corner.x < vc.columnIndex ||

            // entire selection scrolled out of view between fixed columns and scrollable columns; or
            fixedColumnCount &&
            firstScrollableColumn &&
            (vc = this.visibleColumns[fixedColumnCount - 1]) &&
            selection.origin.x > vc.columnIndex &&
            selection.corner.x < firstScrollableColumn.columnIndex ||

            // entire selection scrolled out of view to right of visible columns; or
            lastScrollableColumn &&
            selection.origin.x > lastScrollableColumn.columnIndex ||

            // entire selection scrolled out of view above visible rows; or
            (vr = this.visibleRows[headerRowCount]) &&
            selection.corner.y < vr.rowIndex ||

            // entire selection scrolled out of view between fixed rows and scrollable rows; or
            fixedRowCount &&
            firstScrollableRow &&
            (vr = this.visibleRows[headerRowCount + fixedRowCount - 1]) &&
            selection.origin.y > vr.rowIndex &&
            selection.corner.y < firstScrollableRow.rowIndex ||

            // entire selection scrolled out of view below visible rows
            lastScrollableRow &&
            selection.origin.y > lastScrollableRow.rowIndex
        ) {
            return;
        }

        const vcOrigin = vci[selection.origin.x] || firstScrollableColumn;
        const vrOrigin = vri.get(selection.origin.y) || firstScrollableRow;
        const vcCorner = vci[selection.corner.x] || (selection.corner.x > lastScrollableColumn.columnIndex ? lastScrollableColumn : vci[fixedColumnCount - 1]);
        const vrCorner = vri.get(selection.corner.y) || (selection.corner.y > lastScrollableRow.rowIndex ? lastScrollableRow : vri.get(fixedRowCount - 1));

        if (!(vcOrigin && vrOrigin && vcCorner && vrCorner)) {
            return;
        }

        // Render the selection model around the bounds
        const bounds: CellInfo.Bounds = {
            x: vcOrigin.left,
            y: vrOrigin.top,
            width: vcCorner.rightPlus1 - vcOrigin.left,
            height: vrCorner.bottom - vrOrigin.top
        };

        const config = {
            columnName: '',
            bounds,
            selectionRegionOverlayColor: this.gridPainter.partial ? 'transparent' : gridProps.selectionRegionOverlayColor,
            selectionRegionOutlineColor: gridProps.selectionRegionOutlineColor,
        } as CellPaintConfig;

        const lastSelectionRenderer = this.cellPainterRepository.get(LastSelectionCellPainter.typeName) as LastSelectionCellPainter;
        lastSelectionRenderer.paint(gc, config);

        if (this.gridPainter.key === 'by-cells') {
            this.gridPainter.reset = true; // fixes GRID-490
        }
    }

    /**
     * @desc iterate the renderering overrides and manifest each
     */
    renderOverrides(gc: CanvasRenderingContext2DEx) {
        const cache = this.grid.renderOverridesCache;
        for (const key in cache) {
            if (cache.hasOwnProperty(key)) {
                const override = cache[key] as Hypegrid.RenderOverridesCache.Floater | Hypegrid.RenderOverridesCache.Dragger | null;
                if (override) {
                    this.renderOverride(gc, override);
                }
            }
        }
    }

    /**
     * @desc copy each overrides specified area to it's target and blank out the source area
     * @param override - an object with details contain an area and a target context
     */
    renderOverride(gc: CanvasRenderingContext2DEx, override: Hypegrid.RenderOverridesCache.Floater | Hypegrid.RenderOverridesCache.Dragger) {
        //lets blank out the drag row
        const hdpiRatio = override.hdpiratio;
        const startX = override.startX; //hdpiRatio * edges[override.columnIndex];
        const width = override.width + 1;
        const height = override.height;
        const targetCTX = override.ctx;
        const imgData = gc.getImageData(startX, 0, Math.round(width * hdpiRatio), Math.round(height * hdpiRatio));
        targetCTX.putImageData(imgData, 0, 0);
        gc.cache.fillStyle = this.properties.backgroundColor2;
        gc.fillRect(Math.round(startX / hdpiRatio), 0, width, height);
    }

    /**
     * @returns Current vertical scroll value.
     */
    getScrollTop(): number {
        return this.grid.getVScrollValue();
    }

    /**
     * @returns Current horizontal scroll value.
     */
    getScrollLeft(): number {
        return this.grid.getHScrollViewportStartColumnIndex();
    }

    /**
     * @returns The last col was rendered (is visible)
     */
    isLastColumnVisible(): boolean {
        const lastColumnIndex = this.grid.getColumnCount() - 1;
        return !!this.visibleColumns.find((vc) => { return vc.columnIndex === lastColumnIndex; });
    }

    /**
     * @returns The rendered column width at index
     */
    getRenderedWidth(index: number) {
        const columns = this.visibleColumns;
        let result: number;

        if (index >= columns.length) {
            result = columns[columns.length - 1].rightPlus1;
        } else {
            result = columns[index].left;
        }

        return result;
    }

    /**
     * @returns The rendered row height at index
     */
    getRenderedHeight(index: number): number {
        const rows = this.visibleRows;
        let result: number;

        if (index >= rows.length) {
            const last = rows[rows.length - 1];
            result = last.bottom;
        } else {
            result = rows[index].top;
        }

        return result;
    }

    /**
     * @returns User is currently dragging a column for reordering.
     */
    isDraggingColumn(): boolean {
        return this.grid.isDraggingColumn();
    }

    /**
     * @returns The row to go to for a page up.
     */
    getPageUpRow(): number {
        const grid = this.grid;
        const scrollHeight = this.getVisibleScrollHeight();
        let top = this.dataWindow.origin.y - this.properties.fixedRowCount - 1;
        let scanHeight = 0;
        while (scanHeight < scrollHeight && top >= 0) {
            scanHeight += grid.getRowHeight(top);
            top--;
        }
        return top + 1;
    }

    /**
     * @returns The row to goto for a page down.
     */
    getPageDownRow(): number {
        return this.dataWindow.corner.y - this.properties.fixedRowCount;
    }

    renderErrorCell(grid: Hypegrid, err: Error, gc: CanvasRenderingContext2DEx, vc: Renderer.VisibleColumn, vr: Renderer.VisibleRow) {
        const message = (err && (err.message ?? `${err}`)) ?? 'Unknown error.';

        const renderCell = new RenderCell(grid, vc.columnIndex, vr.rowIndex);
        const config = renderCell.subgrid.getCellPaintConfig(renderCell);
        const bounds = { x: vc.left, y: vr.top, width: vc.width, height: vr.height };
        config.bounds = bounds;

        console.error(message);

        gc.cache.save(); // define clipping region
        gc.beginPath();
        gc.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        gc.clip();

        const errorCell = this.cellPainterRepository.get(ErrorCellPainter.typeName) as ErrorCellPainter;
        errorCell.paintMessage(gc, config, message);

        gc.cache.restore(); // discard clipping region
    }

    /**
     * This function creates several data structures:
     * * {@link Renderer#visibleColumns}
     * * {@link Renderer#visibleRows}
     *
     * Original comment:
     * "this function computes the grid coordinates used for extremely fast iteration over
     * painting the grid cells. this function is very fast, for thousand rows X 100 columns
     * on a modest machine taking usually 0ms and no more that 3 ms."
     *
     * @this {Renderer}
     */
    internalComputeCellsBounds() {
        const scrollTop = this.getScrollTop();
        // const scrollLeft = this.getScrollLeft();
        const scrollAnchorColumnIndex = this._scrollAnchorColumnIndex;
        const scrollAnchorColumnOffset = this._scrollAnchorColumnOffset;

        const bounds = this.getBounds();
        const grid = this.grid;
        const behavior = grid.behavior;
        const leftMostColIndex = 0;

        const editorCellEvent = grid.cellEditor && grid.cellEditor.event;

        let vcEd: Renderer.VisibleColumn;
        let xEd: number;
        let vrEd: Renderer.VisibleRow;
        let yEd: number;
        let sgEd: Subgrid;
        let isSubgridEd: boolean;

        let insertionBoundsCursor = 0;
        let previousInsertionBoundsCursorValue = 0;

        const gridProps = grid.properties;
        // const borderBox = gridProps.boxSizing === 'border-box';
        const gridRightAligned = gridProps.gridRightAligned;
        const visibleColumnWidthAdjust = gridProps.visibleColumnWidthAdjust;

        const lineWidthV = gridProps.gridLinesVWidth;
        const lineGapV = lineWidthV;

        const lineWidthH = gridProps.gridLinesHWidth;
        const lineGapH = lineWidthH;

        const fixedColumnCount = this.grid.getFixedColumnCount();
        const lastFixedColumnIndex = fixedColumnCount - 1;
        const fixedRowCount = this.grid.getFixedRowCount();

        let subrows: number; // rows in subgrid
        let fixedRowIndex = -1;
        let fixedWidthV: number;
        let fixedWidthH: number;
        let fixedGapH: number;
        let fixedOverlapH: number;
        const subgrids = behavior.subgrids;
        let subgrid: Subgrid;
        let rowIndex: number;
        let scrollableSubgrid: boolean;
        let vy: number;
        let vr: Renderer.VisibleRow;
        let vc: Renderer.VisibleColumn;
        let height: number;
        let firstVX: number;
        let lastVX: number;
        let firstVY: number;
        let lastVY: number;
        let topR: number;

        if (editorCellEvent) {
            xEd = editorCellEvent.gridCell.x;
            yEd = editorCellEvent.dataCell.y;
            sgEd = editorCellEvent.subgrid;
        }

        if (fixedRowCount) {
            fixedRowIndex = fixedRowCount;
        }

        if (gridProps.fixedLinesVWidth === undefined) {
            fixedWidthV = lineWidthV;
        } else {
            fixedWidthV = gridProps.fixedLinesVWidth;
        }

        if (gridProps.fixedLinesHWidth === undefined) {
            fixedRowIndex = -1; // above any row
        } else {
            fixedWidthH = Math.max(gridProps.fixedLinesHWidth || lineWidthH, lineWidthH);
            fixedGapH = fixedWidthH; // hangover from borderBox
            fixedOverlapH = fixedGapH - fixedWidthH;
        }

        this.scrollHeight = 0;

        this.visibleColumns.length = 0;
        this.visibleColumns.gap = this.visibleColumns[-1] = this.visibleColumns[-2] = undefined;

        this.visibleRows.length = 0;
        this.visibleRows.gap = undefined;

        this.visibleColumnsByIndex.length = 0;
        this.visibleRowsByDataRowIndex.clear();

        this.insertionBounds.length = 0;

        const X = bounds.width ?? grid.canvas.width; // horizontal pixel loop limit
        const C = grid.getColumnCount();

        let startX: number; // horizontal pixel loop index
        let start: number; // first visible index
        if (!gridRightAligned || scrollAnchorColumnIndex < fixedColumnCount) {
            startX = 0;
            start = leftMostColIndex;
        } else {
            // We want to right align the grid in the canvas.  The last column (after scrolling) is always visible.  Work backwards to see which
            // column is the first visible and what its x position is.
            startX = X; // horizontal pixel loop index
            start = scrollAnchorColumnIndex + 1;

            do {
                start--;

                if (start < C) {
                    if (start === lastFixedColumnIndex) {
                        startX = startX - fixedWidthV;
                    } else {
                        if (startX !== X) {
                            // not right most
                            startX = startX - lineGapV;
                        }
                    }
                    let width = Math.ceil(behavior.getColumnWidth(start));
                    if (start === this._scrollAnchorColumnIndex && scrollAnchorColumnOffset > 0) {
                        width -= scrollAnchorColumnOffset;
                        if (width < 0) {
                            width = 0;
                        }
                    }
                    startX = startX - width;
                }

            } while (start > leftMostColIndex && startX > 0)

            this._scrollOppositeAnchorColumnIndex = start;

/*            while (start > leftMostColIndex) {
                if (startX < 0) {
                    // no space left
                    break;
                } else {
                    if (!hasTreeColumn && start === treeColumnIndex) {
                        continue;
                    }

                    const gap = start === fixedColumnIndex;
                    if (gap) {
                        startX = startX - fixedGapV;
                    } else {
                        const notRightMost = startX !== X;
                        if (notRightMost) {
                            startX = startX - lineGapV;
                        }
                    }

                    let vx = start;
                    if (start >= fixedColumnCount) {
                        vx -= scrollLeft;
                    }
                    if (vx < 0) {
                        break; // scrolled beyond first column
                    }

                    const width = Math.ceil(behavior.getColumnWidth(vx));

                    startX = startX - width;
                    start--;
                }
            }*/
        }

        // Now that start has been calculated, can calculate visible column values
        let x = startX;
        let vcIndex = 0;
        let isFirstNonFixedColumn = start >= fixedColumnCount;
        let firstNonFixedColumnLeft = 0;
        let gapLeft: number | undefined;
        for (let c = start; c < C; c++) {
            if (x > X) {
                break; // no space left
            } else {
                if (c === fixedColumnCount) {
                    isFirstNonFixedColumn = true;
                }
                if (gridRightAligned || c < fixedColumnCount || c >= scrollAnchorColumnIndex) {
                    if (isFirstNonFixedColumn) {
                        firstNonFixedColumnLeft = x;
                    }

                    const isNonFixedColumn = c >= fixedColumnCount;

                    if (isNonFixedColumn) {
                        lastVX = c;
                        if (firstVX === undefined) {
                            firstVX = lastVX;
                        }
                    }

                    const columnWidth = behavior.getColumnWidth(c);
                    let left: number;
                    let columnOrAnchoredWidth = behavior.getColumnWidth(c);
                    if (c === scrollAnchorColumnIndex) {
                        columnOrAnchoredWidth = columnWidth - scrollAnchorColumnOffset;
                        if (gridRightAligned) {
                            left = x;
                        } else {
                            left = x - scrollAnchorColumnOffset;
                        }
                    } else {
                        columnOrAnchoredWidth = columnWidth;
                        left = x;
                    }

                    let visibleWidth = columnWidth;
                    if (visibleColumnWidthAdjust) {
                        if (gridRightAligned) {
                            if (isFirstNonFixedColumn && left < 0) {
                                visibleWidth += left;
                                left = 0;
                            }
                        } else {
                            if (isFirstNonFixedColumn && left < firstNonFixedColumnLeft) {
                                visibleWidth -= (firstNonFixedColumnLeft - left);
                                left = firstNonFixedColumnLeft;
                            }
                        }
                        if (left + visibleWidth > X) {
                            visibleWidth = X - left;
                        }
                    }
                    visibleWidth = Math.floor(visibleWidth);

                    const rightPlus1 = left + visibleWidth;

                    this.visibleColumns[vcIndex] = this.visibleColumnsByIndex[c] = vc = {
                        index: vcIndex,
                        columnIndex: c,
                        column: behavior.getActiveColumn(c),
                        left,
                        width: visibleWidth,
                        rightPlus1
                    };

                    if (gapLeft !== undefined) {
                        // must be first non fixed column
                        this.visibleColumns.gap = {
                            left: gapLeft, // from previous loop
                            rightPlus1: vc.left
                        };
                        gapLeft = undefined;
                    }

                    if (xEd === c) {
                        vcEd = vc;
                    }

                    if (isFirstNonFixedColumn) {
                        isFirstNonFixedColumn = false;
                    }


                    x = x + columnOrAnchoredWidth;
                    if (c === lastFixedColumnIndex) {
                        gapLeft = x; // for next loop
                        x = x + fixedWidthV;
                    } else {
                        x = x + lineGapV;
                    }

                    vcIndex++;

                    insertionBoundsCursor += Math.round(visibleWidth / 2) + previousInsertionBoundsCursorValue;
                    this.insertionBounds.push(insertionBoundsCursor);
                    previousInsertionBoundsCursorValue = Math.round(visibleWidth / 2);
                }
            }
        }

        if (!gridRightAligned) {
            this._scrollOppositeAnchorColumnIndex = start + this.visibleColumns.length;
        }

        // get height of total number of rows in all subgrids following the data subgrid
        const footerHeight = gridProps.defaultRowHeight * behavior.getFooterRowCount();

        let base = 0; // sum of rows for all subgrids so far
        let y = 0; // vertical pixel loop index and limit
        const Y = bounds.height - footerHeight; // vertical pixel loop index and limit
        const G = subgrids.length; // subgrid loop index and limit
        let r = 0; // row loop index
        for (let g = 0; g < G; g++, base += subrows) {
            subgrid = subgrids[g];
            subrows = subgrid.dataModel.getRowCount();
            scrollableSubgrid = subgrid.isData;
            isSubgridEd = (sgEd === subgrid);
            topR = r;

            // For each row of each subgrid...
            const R = r + subrows; // row loop limit
            for (; r < R && y < Y; r++) {
                const gap = scrollableSubgrid && r === fixedRowIndex;
                if (gap) {
                    this.visibleRows.gap = {
                        top: vr.bottom + fixedOverlapH,
                        bottom: undefined
                    };
                    y += fixedGapH;
                } else if (y) {
                    y += lineGapH;
                }


                vy = r;
                if (scrollableSubgrid && r >= fixedRowCount) {
                    vy += scrollTop;
                    lastVY = vy - base;
                    if (firstVY === undefined) {
                        firstVY = lastVY;
                    }
                    if (vy >= R) {
                        break; // scrolled beyond last row
                    }
                }

                rowIndex = vy - base;
                height = behavior.getRowHeight(rowIndex, subgrid);

                this.visibleRows[r] = vr = {
                    index: r,
                    subgrid: subgrid,
                    rowIndex: rowIndex,
                    top: y,
                    height: height,
                    bottom: y + height
                };

                if (gap) {
                    this.visibleRows.gap.bottom = vr.top;
                }

                if (scrollableSubgrid) {
                    this.visibleRowsByDataRowIndex.set(vy - base, vr);
                }

                if (isSubgridEd && yEd === rowIndex) {
                    vrEd = vr;
                }

                y += height;
            }

            if (scrollableSubgrid) {
                subrows = r - topR;
            }
        }

        if (editorCellEvent) {
            editorCellEvent.visibleColumn = vcEd;
            editorCellEvent.visibleRow = vrEd;
            editorCellEvent.gridCell.y = vrEd && vrEd.index;
            editorCellEvent._bounds = null;
        }

        this.dataWindow = new InclusiveRectangle(
            firstVX,
            firstVY,
            Math.min(lastVX - firstVX + 1, this.visibleColumns.length),
            Math.min(lastVY - firstVY + 1, this.visibleRows.length)
        );

        // Resize CellEvent pool
        const pool = this.renderCellPool;
        const previousLength = pool.length;
        const P = this.visibleColumns.length * this.visibleRows.length;

        if (P > previousLength) {
            pool.length = P; // grow pool to accommodate more cells
        }
        for (let p = previousLength; p < P; p++) {
            pool[p] = new RenderCell(this.grid); // instantiate extra required - all real RenderCell (and CellEvent) objects are created here
        }

        this.resetAllGridRenderers();
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
            const gridProps = this.properties;
            const C1 = C - 1;
            const R1 = R - 1;
            let rowHeader: Renderer.VisibleColumn;
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
                            vc && // tree column may not be defined
                            c < C1 // don't draw rule after last column
                        ) {
                            const x = vc.rightPlus1;
                            const lineTop = Math.max(top, vc.top || 0); // vc.top may be set by grouped headers plug-in
                            const height = Math.min(bottom, vc.bottom || Infinity) - lineTop; // vc.bottom may be set by grouped headers plug-in

                            // draw a single vertical grid line between both header and data cells OR a line segment in header only
                            gc.fillRect(x, lineTop, gridLinesVWidth, height);

                            // when above drew a line segment in header (vc.bottom defined AND higher up), draw a second vertical grid line between data cells
                            if (gridProps.gridLinesUserDataArea && vc.bottom < userDataAreaTop) {
                                gc.fillRect(x, userDataAreaTop, gridLinesVWidth, bottom - userDataAreaTop);
                            }
                        }
                    });
                }
            }

            if (
                gridProps.gridLinesH && (
                    gridProps.gridLinesUserDataArea ||
                    (rowHeader = gridProps.gridLinesRowHeader && (visibleColumns[-1] || visibleColumns[-2]))
                )
            ) {
                const gridLinesHWidth = gridProps.gridLinesHWidth;
                const left = rowHeader !== undefined ? 0 : firstVisibleColumnLeft;
                const right = gridProps.gridLinesUserDataArea ? lastVisibleColumnRight : rowHeader.rightPlus1;

                gc.cache.fillStyle = gridLinesHColor;

                visibleRows.forEach(function(vr, r) {
                    if (r < R1) { // don't draw rule below last row
                        const y = vr.bottom;
                        gc.fillRect(left, y, right - left, gridLinesHWidth);
                    }
                });
            }

            // draw fixed rule lines over grid rule lines
            let edgeWidth: number
            let rowGap: Renderer.VisibleRowArray.Gap;

            if (gridProps.fixedLinesHWidth !== undefined) {
                if ((rowGap = visibleRows.gap)) {
                    gc.cache.fillStyle = gridProps.fixedLinesHColor || gridLinesHColor;
                    edgeWidth = gridProps.fixedLinesHEdge;
                    if (edgeWidth) {
                        gc.fillRect(firstVisibleColumnLeft, rowGap.top, viewWidth, edgeWidth);
                        gc.fillRect(firstVisibleColumnLeft, rowGap.bottom - edgeWidth, viewWidth, edgeWidth);
                    } else {
                        gc.fillRect(firstVisibleColumnLeft, rowGap.top, viewWidth, rowGap.bottom - rowGap.top);
                    }
                }
            }

            let columnGap: Renderer.VisibleColumnArray.Gap;
            if (gridProps.fixedLinesVWidth !== undefined) {
                if ((columnGap = visibleColumns.gap)) {
                    gc.cache.fillStyle = gridProps.fixedLinesVColor || gridLinesVColor;
                    edgeWidth = gridProps.fixedLinesVEdge;
                    if (edgeWidth) {
                        gc.fillRect(columnGap.left, 0, edgeWidth, viewHeight);
                        gc.fillRect(columnGap.rightPlus1 - edgeWidth, 0, edgeWidth, viewHeight);
                    } else {
                        gc.fillRect(columnGap.left, 0, columnGap.rightPlus1 - columnGap.left, viewHeight);
                    }
                }
            }
        }
    }

    /**
     * Overridable for alternative or faster logic.
     * @param CellEvent
     * @returns {object} Layered config object.
     */
    // assignProps: layerProps,

    /**
     * @param colIndexOrCellEvent - This is the "data" x coordinate.
     * @param rowIndex - This is the "data" y coordinate. Omit if `colIndexOrCellEvent` is a `CellEvent`.
     * @param subgrid Omit if `colIndexOrCellEvent` is a `CellEvent`.
     * @returns The matching `CellEvent` object from the renderer's pool. Returns `undefined` if the requested cell is not currently visible (due to being scrolled out of view).
     */
    findCell(colIndexOrCellEvent: number | CellInfo, rowIndex?: number, subgrid?: Subgrid) {
        let colIndex: number;
        const pool = this.renderCellPool;

        if (typeof colIndexOrCellEvent === 'object') {
            // colIndexOrCellEvent is a cell event object
            subgrid = colIndexOrCellEvent.subgrid;
            rowIndex = colIndexOrCellEvent.dataCell.y;
            colIndex = colIndexOrCellEvent.dataCell.x;
        } else {
            colIndex = colIndexOrCellEvent;
        }

        subgrid = subgrid ?? this.grid.behavior.mainSubgrid;

        let len = this.visibleColumns.length;
        len *= this.visibleRows.length;
        for (let p = 0; p < len; ++p) {
            const renderCell = pool[p];
            if (
                renderCell.subgrid === subgrid &&
                renderCell.dataCell.x === colIndex &&
                renderCell.dataCell.y === rowIndex
            ) {
                return renderCell;
            }
        }
        return undefined;
    }

    /**
     * Resets the cell properties cache in the matching `CellEvent` object from the renderer's pool. This will insure that a new cell properties object will be known to the renderer. (Normally, the cache is not reset until the pool is updated by the next call to {@link Renderer#computeCellBounds}).
     */
    resetCellPropertiesCache(xOrCellEvent: number | CellInfo, y?: number, subgrid?: Subgrid) {
        const renderCell = this.findCell(xOrCellEvent, y, subgrid);
        if (renderCell) {
            renderCell.clearCellOwnProperties();
        }
    }

    resetAllCellPropertiesCaches() {
        this.renderCellPool.forEach((cellEvent) => {
            cellEvent.clearCellOwnProperties();
        });
    }

    getBounds() {
        return this.bounds;
    }

    setBounds(bounds: Renderer.Bounds) {
        return (this.bounds = bounds);
    }

    setInfo(message: string) {
        let width: number;
        if (this.visibleColumns.length) {
            width = this.visibleColumns[this.visibleColumns.length - 1].rightPlus1;
        }
        this.grid.canvas.setInfo(message, width);
    }

    private fetchCompletion(gc: CanvasRenderingContext2DEx, fetchError: boolean) {
        if (!fetchError) {
            // STEP 1: Render the grid immediately (before next refresh) just to get column widths
            // (for better performance this could be done off-screen but this works fine as is)
            this.gridPainter.paint(gc);
            // STEP 2: Re-render upon next refresh with proper column widths
            this.grid.repaint();
        }
    }

    /**
     * @summary Create a list of `Rectangle`s representing visible cells.
     * @desc When `grid.properties.fetchSubregions` is true, this function needs to handle:
     * 1. unordered columns
     * 2. column gaps (hidden columns)
     * 3. the single row gap that results when there are fixed rows and remaining rows are scrolled down
     *
     * @ToDo This function currently only handles (1) above; needs (2) (multiple rectangles for multiple contiguous column regions) and (3) (double each region for above and below the fixed boundary when scrolled down) as well. In its present form, it will "fetch" all cells from upper left of fixed area to lower right of scrollable area. (Yikes.)
     *
     * When `grid.properties.fetchSubregions` is falsy, this function merely returns `this.dataWindow` as the only rectangle.
     * This is way more efficient than calling `getSubrects` (as it is currently implemented) and is fine so long as there are no fixed columns or rows and column re-ordering is disabled.
     * (If tree column in use, it is a fixed column, but this is workable so long as the data model knows to always return it regardless of rectangle.)
     * Hidden columns within the range of visible columns will be fetched anyway.
     * Column scrolling is ok.
     *
     * @ToDo This function is too slow for practical use due to map and sort.
     *
     * @this {Renderer}
     */
    private getSubrects() {
        const dw = this.dataWindow;
        if (!this.grid.properties.fetchSubregions) {
            const rect = this.grid.newRectangle(dw.left, dw.top, dw.width, dw.height); // convert from InclusiveRect
            return [rect];
        }

        const orderedColumnIndexes = this.visibleColumns.map(
            (vc: Renderer.VisibleColumn) => {
                return vc.column.index;
            }
        ).sort(
            (a, b) => { return a - b; }
        );
        const xMin = orderedColumnIndexes[0];
        const width = orderedColumnIndexes[orderedColumnIndexes.length - 1] - xMin + 1;

        return [this.grid.newRectangle(xMin, dw.top, width, dw.height)];
    }
}

export namespace Renderer {
    export interface GetGridCellFromMousePointResult {
        fake: boolean;
        cellInfo: CellInfo;
    }

    export interface VisibleColumn {
        /** A back reference to the element's array index in {@link Renderer#visibleColumns}. */
        index: number;
        /** Dereferences {@link Behavior#columns}, the subset of _active_ columns, specifying which column to show in that position. */
        columnIndex: number;

        column: Column;
        /** Pixel coordinate of the left edge of this column, rounded to nearest integer. */
        left: number;
        /** Pixel coordinate of the right edge of this column + 1, rounded to nearest integer. */
        rightPlus1: number;
        /** Width of this column in pixels, rounded to nearest integer. */
        width: number;

        top?: number; // not used anymore I think (maybe by tree)
        bottom?: number; // not used anymore I think (maybe by tree)
    }

    export class VisibleColumnArray extends Array<VisibleColumn> {
        gap: VisibleColumnArray.Gap;
    }

    export namespace VisibleColumnArray {
        export interface Gap {
            left: number;
            rightPlus1: number | undefined;
        }
    }

    export interface VisibleRow {
        /** A back reference to the element's array index in {@link Renderer#visibleRows}. */
        index: number;
        /** Local vertical row coordinate within the subgrid to which the row belongs, adjusted for scrolling. */
        rowIndex: number;
        /** A reference to the subgrid to which the row belongs. */
        subgrid: Subgrid;
        /** Pixel coordinate of the top edge of this row, rounded to nearest integer. */
        top: number;
        /** Pixel coordinate of the bottom edge of this row, rounded to nearest integer. */
        bottom: number;
        /** Height of this row in pixels, rounded to nearest integer. */
        height: number;
    }

    export class VisibleRowArray extends Array<VisibleRow> {
        gap: VisibleRowArray.Gap | undefined;
    }

    export namespace VisibleRowArray {
        export interface Gap {
            top: number;
            bottom: number | undefined;
        }
    }

    export interface Bounds {
        width: number;
        height: number;
    }

    export class SubrowsValue extends Array<unknown> {
        subrows: unknown;
    }
}

export interface CalculatedScrollAnchor {
    index: number; // Index of column/row
    offset: number; // number of pixels anchor is offset in current column/row
}
