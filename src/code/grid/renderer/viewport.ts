import { CanvasEx } from '../canvas/canvas-ex';
import { ViewportCell } from '../cell/viewport-cell';
import { Column } from '../column/column';
import { ColumnsManager } from '../column/columns-manager';
import { ColumnInterface } from '../common/column-interface';
import { SubgridInterface } from '../common/subgrid-interface';
import { EventDetail } from '../event/event-detail';
import { GridProperties } from '../grid-properties';
import { ContiguousIndexRange } from '../lib/contiguous-index-range';
import { Rectangle } from '../lib/rectangle';
import { RectangleInterface } from '../lib/rectangle-interface';
import { AssertError, UnreachableCaseError } from '../lib/revgrid-error';
import { DataModel } from '../model/data-model';
import { Revgrid } from '../revgrid';
import { Subgrid } from '../subgrid/subgrid';
import { SubgridsManager } from '../subgrid/subgrids-manager';


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
 * Same parameters as {@link Viewport#initialize|initialize}, which is called by this constructor.
 *
 */
export class Viewport {
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
    readonly columns = new Viewport.ViewportColumnArray();

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
    readonly rows = new Viewport.ViewportRowArray();
    readonly cellPool = new Array<ViewportCell>();

    computedEventer: Viewport.ComputedEventer;

    private readonly _dummyUnusedColumn: Column;

    private _valid = false;

    private _mainSubgrid: Subgrid;
    private _mainDataModel: DataModel;

    private _columnsByIndex = new Array<Viewport.ViewportColumn>();  // array because number of columns will always be reasonable
    private _rowsByDataRowIndex = new Map<number, Viewport.ViewportRow>(); // hash because keyed by (fixed and) scrolled row indexes
    private _cellPoolOrder: Viewport.CellPoolOrder | undefined;

    // I don't think this is used
    private _insertionBounds = new Array<number>();

    private _lastKnowMainRowCount: number | undefined;

    scrollableColumnRange: ContiguousIndexRange | undefined;
    scrollableRowRange: ContiguousIndexRange | undefined;

    bounds: Viewport.Bounds;

    private _horizontalScrollableContentOverflowed: boolean;
    // Specifies the index of the column anchored to the bounds edge
    // Will be first non-fixed visible column or last visible column depending on the gridRightAligned property
    // Set to -1 if there is no space scrollable columns (ie only space for fixed columns)
    private _columnScrollAnchorIndex: number;
    // Specifies the number of pixels of the anchored column which have been scrolled off the viewport
    private _columnScrollAnchorOffset: number;

    // Specifies the number of pixels the column at the opposite end of the anchored column has off the viewport
    // This value will be:
    // * undefined if unanchored column does not reach the end of the viewport.
    // * 0 if the unanchored column is touches the edge of the viewport with no overflow
    // * Positive number which specifies the number of pixels the column overflows the grid on the unanchored side
    private _unanchoredColumnOverflow: number | undefined;

    // Limits to which column scroll anchor can be moved to
    private _leftColumnScrollAnchorLimitIndex: number;
    private _leftColumnScrollAnchorLimitOffset: number;
    private _rightColumnScrollAnchorLimitIndex: number;
    private _rightColumnScrollAnchorLimitOffset: number;

    // Index of the first scrollable column in VisibleColumns
    private _firstScrollableColumnIndex: number | undefined;
    private _lastScrollableColumnIndex: number | undefined;

    private _fixedColumnsViewWidth = 0;
    private _scrollableColumnsViewWidth = 0;
    private _columnsViewWidth = 0;

    // Index of the first scrollable column in VisibleColumns
    private _firstScrollableRowIndex: number | undefined;
    private _lastScrollableRowIndex: number | undefined;

    //the shared single item "pooled" cell object for drawing each cell
    private cell = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    }

    get horizontalScrollableContentOverflowed() { return this._horizontalScrollableContentOverflowed; }

    get columnScrollAnchorIndex() { return this._columnScrollAnchorIndex; }
    get columnScrollAnchorOffset() { return this._columnScrollAnchorOffset; }

    get unanchoredColumnOverflow() { return this._unanchoredColumnOverflow; }

    get firstScrollableColumnIndex() { return this._firstScrollableColumnIndex; }
    get firstScrollableColumn() {
        const firstScrollableColumnIndex = this._firstScrollableColumnIndex;
        if (firstScrollableColumnIndex === undefined) {
            return undefined;
        } else {
            return this.columns[firstScrollableColumnIndex];
        }
    }
    get firstScrollableActiveColumnIndex() {
        const firstScrollableColumnIndex = this._firstScrollableColumnIndex;
        if (firstScrollableColumnIndex === undefined) {
            return undefined;
        } else {
            return this.columns[firstScrollableColumnIndex].activeColumnIndex;
        }
    }
    get firstScrollableColumnViewLeft(): number | undefined {
        const firstScrollableVisibleColumnIndex = this._firstScrollableColumnIndex;
        if (firstScrollableVisibleColumnIndex === undefined) {
            return undefined;
        } else {
            const firstScrollableColumnOverflow = this.firstScrollableColumnLeftOverflow;
            const left = this.columns[firstScrollableVisibleColumnIndex].left;
            if (firstScrollableColumnOverflow === undefined) {
                return left;
            } else {
                return left + firstScrollableColumnOverflow;
            }
        }
    }
    get firstScrollableColumnLeftOverflow(): number | undefined {
        const firstScrollableVisibleColumnIndex = this._firstScrollableColumnIndex;
        if (firstScrollableVisibleColumnIndex === undefined) {
            return undefined;
        } else {
            if (this._gridProperties.gridRightAligned) {
                if (this._unanchoredColumnOverflow === undefined) {
                    return undefined;
                } else {
                    return this._unanchoredColumnOverflow;
                }
            } else {
                return this._columnScrollAnchorOffset;
            }
        }
    }

    get lastScrollableActiveColumnIndex() {
        const lastScrollableColumnIndex = this._lastScrollableColumnIndex;
        if (lastScrollableColumnIndex === undefined) {
            return undefined;
        } else {
            return this.columns[lastScrollableColumnIndex].activeColumnIndex;
        }
    }
    get lastScrollableColumnRightOverflow(): number | undefined {
        const lastScrollableColumnIndex = this._lastScrollableColumnIndex;
        if (lastScrollableColumnIndex === undefined) {
            return undefined;
        } else {
            if (this._gridProperties.gridRightAligned) {
                return this._columnScrollAnchorOffset;
            } else {
                if (this._unanchoredColumnOverflow === undefined) {
                    return undefined;
                } else {
                    return this._unanchoredColumnOverflow;
                }
            }
        }
    }

    get fixedColumnsViewWidth() { return this._fixedColumnsViewWidth; }
    get scrollableColumnsViewWidth() { return this._scrollableColumnsViewWidth; }
    get columnsViewWidth() { return this._columnsViewWidth; }

    get firstScrollableRowIndex() { return this._firstScrollableRowIndex; }
    get firstScrollableRowViewTop() {
        const firstScrollableRowIndex = this._firstScrollableRowIndex;
        if (firstScrollableRowIndex === undefined) {
            return undefined
        } else {
            return this.rows[firstScrollableRowIndex].top;
        }
    }

    get lastScrollableRowIndex() { return this._lastScrollableRowIndex; }

    get scrollableBounds(): Rectangle | undefined {
        const x = this.firstScrollableColumnViewLeft;
        if (x === undefined) {
            return undefined;
        } else {
            const y = this.firstScrollableRowViewTop;
            if (y === undefined) {
                return undefined;
            } else {
                const width = this._scrollableColumnsViewWidth;
                const height = this._canvasEx.bounds.y - y; // this does not handle situation where rows do not fill the view
                return new Rectangle(x, y, width, height);
            }
        }
    }

    get properties() { return this.grid.properties; }

    get firstScrollableVisibleColumnMaximallyVisible() {
        if (this._gridProperties.gridRightAligned) {
            return this._unanchoredColumnOverflow === undefined || this._unanchoredColumnOverflow === 0;
        } else {
            return this._columnScrollAnchorOffset === 0;
        }
    }

    get lastScrollableVisibleColumnMaximallyVisible() {
        if (this._gridProperties.gridRightAligned) {
            return this._columnScrollAnchorOffset === 0;
        } else {
            return this._unanchoredColumnOverflow === undefined || this._unanchoredColumnOverflow === 0;
        }
    }

    constructor(
        public readonly grid: Revgrid,
        private readonly _gridProperties: GridProperties,
        private readonly _canvasEx: CanvasEx,
        private readonly _columnsManager: ColumnsManager,
        private readonly _subgridsManager: SubgridsManager,
        private readonly _getRowHeightEventer: Viewport.GetRowHeightEventer,
        private readonly _checkNeedsShapeChangedEventer: Viewport.CheckNeedsShapeChangedEventer,
    ) {
        this._dummyUnusedColumn = this._columnsManager.createDummyColumn();
        this.reset();
    }

    reset() {
        this.columns.length = 0;
        this.rows.length = 0;

        this._insertionBounds.length = 0;

        this.cellPool.length = 0;

        this.resetScrollAnchor();
    }

    invalidate() {
        this._valid = false;
    }

    ensureValid() {
        const rowCount = this._subgridsManager.mainSubgrid.getRowCount();
        if (rowCount !== this._lastKnowMainRowCount) {
            this._valid = false;
            this._lastKnowMainRowCount = rowCount;
        }

        this._checkNeedsShapeChangedEventer();

        if (!this._valid) {
            this.internalComputeCellsBounds();
        }
    }

    resetCellPoolWithColumnRowOrder() {
        const rows = this.rows;
        const rowCount = rows.length
        const pool = this.cellPool;
        let p = 0;
        this.columns.forEach((column) => {
            for (let r = 0; r < rowCount; r++, p++) {
                const row = rows[r];
                // reset pool member to reflect coordinates of cell in newly shaped grid
                pool[p].reset(column, row);
            }
        });
        this._cellPoolOrder = Viewport.CellPoolOrder.ColumnRow;
    }

    resetCellPoolWithRowColumnOrder() {
        const rows = this.rows;
        const rowCount = rows.length;
        const columns = this.columns;
        const pool = this.cellPool;
        let p = 0;
        for (let r = 0; r < rowCount; r++) {
            const row = rows[r];
            columns.forEach((column) => { // eslint-disable-line no-loop-func
                p++;
                // reset pool member to reflect coordinates of cell in newly shaped grid
                pool[p].reset(column, row);
            });
        }
        this._cellPoolOrder = Viewport.CellPoolOrder.RowColumn;
    }

    updateMainSubgrid() {
        this._mainSubgrid = this._subgridsManager.mainSubgrid;
        this._mainDataModel = this._mainSubgrid.dataModel;
    }

    resetScrollAnchor() {
        this._columnScrollAnchorIndex = this._columnsManager.getFixedColumnCount();
        this._columnScrollAnchorOffset = 0;
        this._leftColumnScrollAnchorLimitIndex = this._columnScrollAnchorIndex;
        this._leftColumnScrollAnchorLimitOffset = this._columnScrollAnchorOffset;
        this._rightColumnScrollAnchorLimitIndex = this._columnScrollAnchorIndex;
        this._rightColumnScrollAnchorLimitOffset = this._columnScrollAnchorOffset;
    }

    /**
     * @param index - Index of active column that should be anchor
     * @return true if changed
     */
    setColumnScrollAnchor(index: number, offset = 0): boolean {
        if (!this.isColumnScrollAnchorWithinLeftLimit(index, offset)) {
            index = this._leftColumnScrollAnchorLimitIndex;
            offset = this._leftColumnScrollAnchorLimitOffset;
        } else {
            if (!this.isColumnScrollAnchorWithinRightLimit(index, offset)) {
                index = this._rightColumnScrollAnchorLimitIndex;
                offset = this._rightColumnScrollAnchorLimitOffset;
            }
        }

        if (this._columnScrollAnchorIndex !== index || this._columnScrollAnchorOffset !== offset) {
            this._columnScrollAnchorIndex = index;
            this._columnScrollAnchorOffset = offset;
            return true;
        } else {
            return false;
        }
    }

    setColumnScrollAnchorToLimit(gridRightAligned: boolean) {
        if (gridRightAligned) {
            this.setColumnScrollAnchor(this._rightColumnScrollAnchorLimitIndex, this._rightColumnScrollAnchorLimitOffset);
        } else {
            this.setColumnScrollAnchor(this._leftColumnScrollAnchorLimitIndex, this._leftColumnScrollAnchorLimitOffset);
        }
    }

    setColumnScrollAnchorLimits(contentOverflowed: boolean, anchorLimits: Viewport.ScrollAnchorLimits) {
        this._horizontalScrollableContentOverflowed = contentOverflowed;

        this._leftColumnScrollAnchorLimitIndex = anchorLimits.startAnchorLimitIndex;
        this._leftColumnScrollAnchorLimitOffset = anchorLimits.startAnchorLimitOffset;
        this._rightColumnScrollAnchorLimitIndex = anchorLimits.finishAnchorLimitIndex;
        this._rightColumnScrollAnchorLimitOffset = anchorLimits.finishAnchorLimitOffset;

        if (!this.isColumnScrollAnchorWithinLeftLimit(this._columnScrollAnchorIndex, this._columnScrollAnchorOffset)) {
            this._columnScrollAnchorIndex = this._leftColumnScrollAnchorLimitIndex;
            this._columnScrollAnchorOffset = this._leftColumnScrollAnchorLimitOffset;
        } else {
            if (!this.isColumnScrollAnchorWithinRightLimit(this._columnScrollAnchorIndex, this._columnScrollAnchorOffset)) {
                this._columnScrollAnchorIndex = this._rightColumnScrollAnchorLimitIndex;
                this._columnScrollAnchorOffset = this._rightColumnScrollAnchorLimitOffset;
            }
        }
    }

    isColumnScrollAnchorWithinLeftLimit(index: number, offset: number) {
        const result =
            (index > this._leftColumnScrollAnchorLimitIndex)
            ||
            ((index === this._leftColumnScrollAnchorLimitIndex) && (offset <= this._leftColumnScrollAnchorLimitOffset));
        return result;
    }

    isColumnScrollAnchorWithinRightLimit(index: number, offset: number) {
        const result =
            (index < this._rightColumnScrollAnchorLimitIndex)
            ||
            ((index === this._rightColumnScrollAnchorLimitIndex) && (offset <= this._rightColumnScrollAnchorLimitOffset));
        return result;
    }

    isColumnScrollAnchorWithinLimits(index: number, offset: number) {
        return this.isColumnScrollAnchorWithinLeftLimit(index, offset) && this.isColumnScrollAnchorWithinRightLimit(index, offset);
    }

    limitColumnScrollAnchorValues(index: number, offset: number): Viewport.ScrollAnchor {
        if (!this.isColumnScrollAnchorWithinLeftLimit(index, offset)) {
            index = this._leftColumnScrollAnchorLimitIndex;
            offset = this._leftColumnScrollAnchorLimitOffset;
        } else {
            if (!this.isColumnScrollAnchorWithinRightLimit(index, offset)) {
                index = this._rightColumnScrollAnchorLimitIndex;
                offset = this._rightColumnScrollAnchorLimitOffset;
            }
        }

        return {
            index,
            offset
        };
    }

    scrollColumnScrollAnchor(columnCount: number, gridRightAligned: boolean) {
        if (columnCount === 0) {
            return false;
        } else {
            let index: number;
            let offset = 0;
            index = this._columnScrollAnchorIndex + columnCount;
            if (this._columnScrollAnchorOffset > 0) {
                if (columnCount > 0) {
                    if (gridRightAligned) {
                        index--;
                    }
                } else {
                    if (!gridRightAligned) {
                        index++;
                    }
                }
            }

            ({ index, offset } = this.limitColumnScrollAnchorValues(index, offset));

            if (index !== this._columnScrollAnchorIndex || offset !== this._columnScrollAnchorOffset) {
                this._columnScrollAnchorIndex = index;
                this._columnScrollAnchorOffset = offset;
                return true;
            } else {
                return false;
            }
        }
    }

    updateColumnScrollAnchor(viewportStart: number, viewportFinish: number, contentStart: number, contentFinish: number): boolean {
        const { index, offset } = this.calculateColumnScrollAnchor(viewportStart, viewportFinish, contentStart, contentFinish);
        if (index === this._columnScrollAnchorIndex && offset === this._columnScrollAnchorOffset) {
            return false;
        } else {
            this._columnScrollAnchorIndex = index;
            this._columnScrollAnchorOffset = offset;
            return true;
        }
    }

    calculateColumnScrollAnchor(viewportStart: number, viewportFinish: number, contentStart: number, contentFinish: number): Viewport.ScrollAnchor {
        const columnCount = this._columnsManager.getActiveColumnCount();
        const fixedColumnCount = this._columnsManager.getFixedColumnCount();
        const gridProps = this._gridProperties;
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
                    columnLeft = prevColumnLeft - this._columnsManager.getActiveColumnWidth(i);
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
                    index: fixedColumnCount,
                    offset: 0,
                };
            }
        } else {
            let left = contentStart;
            let nextLeft: number;
            for (let i = fixedColumnCount; i < columnCount; i++) {
                nextLeft = this._columnsManager.getActiveColumnWidth(i) + gridLinesVWidth + left;
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
                index = fixedColumnCount;
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
        const gridLinesVWidth = this._gridProperties.gridLinesVWidth;
        const columnCount = this._columnsManager.getActiveColumnCount();
        const fixedColumnCount = this._columnsManager.getFixedColumnCount();
        const columnScrollAnchorIndex = this._columnScrollAnchorIndex;
        let result = contentStart;
        for (let i = fixedColumnCount; i < columnCount; i++) {
            if (i === columnScrollAnchorIndex) {
                break;
            } else {
                result += (this._columnsManager.getActiveColumnWidth(i) + gridLinesVWidth);
            }
        }

        result += this._columnScrollAnchorOffset;

        return result;
    }

    calculateColumnScrollAnchorViewportFinish(contentFinish: number) {
        const gridLinesVWidth = this._gridProperties.gridLinesVWidth;
        const columnCount = this._columnsManager.getActiveColumnCount();
        const fixedColumnCount = this._columnsManager.getFixedColumnCount();
        const columnScrollAnchorIndex = this._columnScrollAnchorIndex;
        let result = contentFinish;
        for (let i = columnCount - 1; i > fixedColumnCount; i--) {
            if (i === columnScrollAnchorIndex) {
                break;
            } else {
                result -= this._columnsManager.getActiveColumnWidth(i);
            }
        }

        if (gridLinesVWidth > 0) {
            const anchorColumnCount = columnCount - columnScrollAnchorIndex;
            if (anchorColumnCount > 1) {
                result -= (anchorColumnCount - 1) * gridLinesVWidth;
            }
        }

        result -= this._columnScrollAnchorOffset;

        return result;
    }

    /**
     * Calculate the scroll anchor to bring a column just but fully into the view. Note, only use when column is on the opposite side of scroll anchor
     * @param activeColumnIndex - index of column to bring into view
     * @returns Scroll Anchor which will ensure the column is displayed
     */
    calculateColumnScrollAnchorToScrollIntoView(activeColumnIndex: number, gridRightAligned: boolean, viewportSize: number): Viewport.ScrollAnchor {
        const gridProperties = this._gridProperties;
        const gridLinesVWidth = gridProperties.gridLinesVWidth;
        let index: number;
        let offset: number;

        if (gridRightAligned) {
            index = this._columnsManager.getActiveColumnCount();
            // calculate relative left of activeColumnIndex
            let left = gridLinesVWidth;
            while (index >= activeColumnIndex) {
                index--;
                left -= (this._columnsManager.getActiveColumnWidth(index) + gridLinesVWidth);
            }
            // calculate viewportFinish needed to just fit in column
            const viewportFinishPlus1 = left + viewportSize;
            // find column which finishes at or crosses this viewport Finish
            let rightPlus1 = left + this._columnsManager.getActiveColumnWidth(index);
            while (rightPlus1 < viewportFinishPlus1) {
                index++;
                rightPlus1 += (this._columnsManager.getActiveColumnWidth(index) + gridLinesVWidth);
            }
            // work out index and offset
            if (rightPlus1 === viewportFinishPlus1) {
                // column finishes exactly at viewportFinish.
                offset = 0;
            } else {
                if (gridProperties.scrollHorizontallySmoothly) {
                    // can display this column partially
                    offset = rightPlus1 - viewportFinishPlus1;
                } else {
                    // use previous column to ensure target is fully displayed
                    index--;
                    offset = 0;
                }
            }

        } else {
            index = this._columnsManager.getFixedColumnCount();
            // calculate relative left of activeColumnIndex
            let left = 0;
            while (index < activeColumnIndex) {
                left += (this._columnsManager.getActiveColumnWidth(index) + gridLinesVWidth);
                index++;
            }
            // calculate relative right of activeColumnIndex;
            const rightPlus1 = left + this._columnsManager.getActiveColumnWidth(index);
            // calculate viewportStart needed to just fit in column
            const viewportStart = rightPlus1 - viewportSize;
            // find column which starts at or crosses this viewport Start
            while (left > viewportStart) {
                index--;
                left -= (this._columnsManager.getActiveColumnWidth(index) + gridLinesVWidth);
            }
            // work out index and offset
            if (left === viewportStart) {
                // column starts exactly at viewportStart.
                offset = 0;
            } else {
                if (gridProperties.scrollHorizontallySmoothly) {
                    // can display this column partially
                    offset = viewportStart - left;
                } else {
                    // use next column to ensure target is fully displayed
                    index++;
                    offset = 0;
                }
            }
        }

        return {
            index,
            offset
        }
    }

    computeCellsBounds() {
        this.internalComputeCellsBounds();
    }

    /**
     * @returns Answer how many rows we rendered
     */
    getRowsCount() {
        return this.rows.length - 1;
    }

    getVisibleScrollHeight() {
        const footerHeight = this._gridProperties.defaultRowHeight * this._subgridsManager.calculateFooterRowCount();
        return this._canvasEx.height - footerHeight - this.grid.getFixedRowsHeight();
    }

    /**
     * @returns Number of columns we just rendered.
     */
    getColumnsCount() {
        return this.columns.length;
    }

    /**
     * @param x - Grid column coordinate.
     * @param y - Grid row coordinate.
     * @returns Bounding rect of cell with the given coordinates.
     */
    getBoundsOfCell(x: number, y: number): RectangleInterface {
        const vc = this.columns[x];
        const vr = this.rows[y];

        return {
            x: vc.left,
            y: vr.top,
            width: vc.width,
            height: vr.height
        };
    }

    /**
     * @desc the index of the column whose edge is closest to the coordinate at pixelX
     * @param pixelX - The horizontal coordinate.
     * @returns The column index under the coordinate at pixelX.
     */
    getActiveColumnWidthEdgeClosestToPixelX(pixelX: number): number {
        const fixedColumnCount = this._columnsManager.getFixedColumnCount();
        const scrolledColumnCount = this._columnScrollAnchorIndex;
        const viewportColumns = this.columns;

        if (this._gridProperties.gridRightAligned) {
            let c = viewportColumns.length - 1;
            let previousColumnCenter: number;
            while (c > 0) {
                previousColumnCenter = viewportColumns[c].left - (viewportColumns[c].left - viewportColumns[c - 1].left) / 2;
                if (pixelX >= previousColumnCenter) {
                    return c;
                }
                c--;
            }
            return 0;
        } else {
            let c = 1;
            let previousColumnCenter: number;
            while (c < viewportColumns.length - 1) {
                previousColumnCenter = viewportColumns[c].left - (viewportColumns[c].left - viewportColumns[c - 1].left) / 2;
                if (pixelX < previousColumnCenter) {
                    if (c > fixedColumnCount) {
                        c += scrolledColumnCount;
                    }
                    return c - 1;
                }
                c++;
            }
            if (c > fixedColumnCount) {
                c += scrolledColumnCount;
            }
            return c - 1;
        }
    }


    /**
     * @desc Answer specific data cell coordinates given mouse coordinates in pixels.
     * @param point
     * @returns Cell coordinates
     */
    findLeftGridLineInclusiveCellFromOffset(x: number, y: number): ViewportCell | undefined {
        const column = this.findLeftGridLineInclusiveColumnFromOffset(x);
        if (column === undefined) {
            this.grid.beCursor(undefined);
            return undefined;
        } else {
            const rows = this.rows;
            const row = rows.find((aVr) => y < aVr.bottom);
            if (row === undefined) {
                this.grid.beCursor(undefined);
                return undefined;
            } else {
                const cell = this.findCell(column.activeColumnIndex, row.index);
                if (cell === undefined) {
                    throw new AssertError('VGCFMP34440');
                } else {
                    return cell;
                }
            }
        }
    }

    findCellFromOffset(x: number, y: number): ViewportCell | undefined {
        const column = this.findColumnFromOffset(x);
        if (column === undefined) {
            this.grid.beCursor(undefined);
            return undefined;
        } else {
            const rows = this.rows;
            const row = rows.find((aVr) => y < aVr.bottom);
            if (row === undefined) {
                this.grid.beCursor(undefined);
                return undefined;
            } else {
                const cell = this.findCell(column.activeColumnIndex, row.index);
                if (cell === undefined) {
                    throw new AssertError('VGCFMP34440');
                } else {
                    return cell;
                }
            }
        }
    }

    findScrollableCellClosestToOffset(x: number, y: number) {
        const columnIndex = this.findIndexOfScrollableColumnClosestToOffset(x);
        if (columnIndex === undefined) {
            return undefined;
        } else {
            const rowIndex = this.findIndexOfScrollableRowClosestToOffset(y);
            if (rowIndex === undefined) {
                return undefined;
            } else {
                return this.findCellAt(columnIndex, rowIndex);
            }
        }
    }

    findLeftGridLineInclusiveColumnFromOffset(x: number) {
        const index = this.findIndexOfLeftGridLineInclusiveColumnFromOffset(x);
        if (index === undefined) {
            return undefined;
        } else {
            return this.columns[index];
        }
    }

    findIndexOfLeftGridLineInclusiveColumnFromOffset(x: number) {
        const columns = this.columns;
        const columnCount = columns.length;
        if (x < 0 || columnCount === 0) {
            return undefined;
        } else {
            for (let i = 0; i < columnCount; i++) {
                const column = columns[i];
                if (x < column.rightPlus1) {
                    return i;
                }
            }
            return undefined;
        }
    }

    findColumnFromOffset(x: number) {
        const columns = this.columns;
        const columnCount = columns.length;
        if (x < 0 || columnCount === 0) {
            return undefined;
        } else {
            for (const column of columns) {
                if (x < column.rightPlus1) {
                    if (x >= column.left) {
                        return column;
                    } else {
                        return undefined;
                    }
                }
            }
            return undefined;
        }
    }

    findIndexOfScrollableColumnClosestToOffset(x: number) {
        const columns = this.columns;
        const columnCount = columns.length;
        const fixedColumnCount = this._gridProperties.fixedColumnCount;
        if (columnCount <= fixedColumnCount) {
            return undefined;
        } else {
            for (let index = 0; index < columnCount; index++) {
                const column = columns[index];
                if (column.activeColumnIndex >= fixedColumnCount && x < column.rightPlus1) {
                    return index;
                }
            }
            return columnCount - 1; // wont be fixed as column count > fixed column count
        }
    }

    findIndexOfScrollableRowClosestToOffset(y: number) {
        const rows = this.rows;
        const rowCount = rows.length;
        const headerPlusFixedRowCount = this._subgridsManager.calculateHeaderPlusFixedRowCount();
        if (rowCount <= headerPlusFixedRowCount) {
            return undefined;
        } else {
            for (let index = 0; index < rowCount; index++) {
                const row = rows[index];
                if (row.index >= headerPlusFixedRowCount && y < row.bottom && row.subgrid.isMain) {
                    return index;
                }
            }
            return rowCount - 1; // wont be header or fixed as row count > header + fixed row count
        }
    }

    createUnusedSpaceColumn(): Viewport.ViewportColumn | undefined {
        const columns = this.columns;
        const columnCount = columns.length;
        if (columnCount === 0) {
            return undefined;
        } else {
            if (this._gridProperties.gridRightAligned) {
                const firstColumn = columns[0];
                const firstColumnLeft = firstColumn.left;
                if (firstColumn.left <= 0) {
                    return undefined;
                } else {
                    const column: Viewport.ViewportColumn = {
                        index: -1,
                        activeColumnIndex: -1,
                        activeColumn: this._dummyUnusedColumn,
                        left: 0,
                        rightPlus1: firstColumnLeft,
                        width: firstColumnLeft,
                    }
                    return column;
                }
            } else {
                const lastColumn = columns[columnCount - 1];
                const lastColumnRightPlus1 = lastColumn.rightPlus1;
                const gridRightPlus1 = this._canvasEx.bounds.width;
                if (lastColumnRightPlus1 >= gridRightPlus1) {
                    return undefined;
                } else {
                    const column: Viewport.ViewportColumn = {
                        index: columnCount,
                        activeColumnIndex: columnCount,
                        activeColumn: this._dummyUnusedColumn,
                        left: lastColumnRightPlus1,
                        rightPlus1: gridRightPlus1,
                        width: gridRightPlus1 - lastColumnRightPlus1,
                    }
                    return column;
                }
            }
        }
    }

    /**
     * Matrix of unformatted values of visible cells.
     */
    getVisibleCellMatrix(): Array<Array<unknown>> {
        const rows = Array<DataModel.DataValue[]>(this.rows.length);
        for (let y = 0; y < rows.length; ++y) {
            rows[y] = Array<DataModel.DataValue>(this.columns.length);
        }

        this.cellPool.forEach((cell) => {
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
     * @param activeIndex - the column index
     * @returns The given column is visible.
     */
    isActiveColumnVisible(activeIndex: number) {
        return this.tryGetColumnWithActiveIndex(activeIndex) !== undefined;
    }

    isActiveColumnFullyVisible(activeIndex: number) {
        return this.tryGetFullyVisibleColumnWithActiveIndex(activeIndex) !== undefined;
    }

    /**
     * @summary Get the "visible column" object matching the provided grid column index.
     * @desc Requested column may not be visible due to being scrolled out of view.
     * @summary Find a visible column object.
     * @param activeColumnIndex - The grid column index.
     * @returns The given column if visible or `undefined` if not.
     */
    tryGetColumnWithActiveIndex(activeColumnIndex: number): Viewport.ViewportColumn | undefined {
        const viewportColumns = this.columns;
        const viewportColumnCount = viewportColumns.length;
        if (viewportColumnCount === 0) {
            return undefined;
        } else {
            const firstViewportColumn = viewportColumns[0];
            const firstActiveColumnIndex = firstViewportColumn.activeColumnIndex;
            if (activeColumnIndex < firstActiveColumnIndex) {
                return undefined
            } else {
                const viewportColumnIndex = activeColumnIndex - firstActiveColumnIndex;
                if (viewportColumnIndex >= viewportColumnCount) {
                    return undefined;
                } else {
                    return viewportColumns[viewportColumnIndex];
                }
            }
        }
    }

    tryGetFullyVisibleColumnWithActiveIndex(activeColumnIndex: number): Viewport.ViewportColumn | undefined {
        const viewportColumns = this.columns;
        const visibleColumnCount = viewportColumns.length;
        if (visibleColumnCount === 0) {
            return undefined;
        } else {
            const firstVisibleColumn = viewportColumns[0];
            const firstActiveColumnIndex = firstVisibleColumn.activeColumnIndex;
            if (activeColumnIndex < firstActiveColumnIndex) {
                return undefined
            } else {
                const visibleColumnIndex = activeColumnIndex - firstActiveColumnIndex;
                if (visibleColumnIndex >= visibleColumnCount) {
                    return undefined;
                } else {
                    if (visibleColumnIndex === 0) {
                        return this.firstScrollableVisibleColumnMaximallyVisible ? viewportColumns[visibleColumnIndex] : undefined;
                    } else {
                        if (visibleColumnIndex === visibleColumnCount - 1) {
                            return this.lastScrollableVisibleColumnMaximallyVisible ? viewportColumns[visibleColumnIndex] : undefined;
                        } else {
                            return viewportColumns[visibleColumnIndex];
                        }
                    }
                }
            }
        }
    }

    /**
     * @summary Get the visibility of the column matching the provided data column index.
     * @desc Requested column may not be visible due to being scrolled out of view or if the column is inactive.
     * @summary Determines if a column is visible.
     * @param columnIndex - the column index
     */
    isDataColumnVisible(columnIndex: number) {
        return this.tryGetColumnWithDataIndex(columnIndex) !== undefined;
    }

    /**
     * @summary Get the "visible column" object matching the provided data column index.
     * @desc Requested column may not be visible due to being scrolled out of view or if the column is inactive.
     * @summary Find a visible column object.
     * @param columnIndex - The grid column index.
     */
    tryGetColumnWithDataIndex(columnIndex: number) {
        return this.columns.find((vc) => {
            return vc.activeColumn.index === columnIndex;
        });
    }

    limitActiveColumnIndexToViewport(activeColumnIndex: number) {
        const firstScrollableColumnIndex = this.firstScrollableColumnIndex;
        if (firstScrollableColumnIndex === undefined) {
            return undefined;
        } else {
            const columns = this.columns;
            const firstScrollableColumn = columns[firstScrollableColumnIndex];
            const firstScrollableActiveColumnIndex = firstScrollableColumn.activeColumnIndex;
            if (activeColumnIndex < firstScrollableActiveColumnIndex) {
                activeColumnIndex = firstScrollableActiveColumnIndex;
            }

            const visibleColumnCount = columns.length;
            const lastScrollableColumn = columns[visibleColumnCount - 1];
            const lastScrollableActiveColumnIndex = lastScrollableColumn.activeColumnIndex;
            if (activeColumnIndex > lastScrollableActiveColumnIndex) {
                activeColumnIndex = lastScrollableActiveColumnIndex;
            }

            return activeColumnIndex;
        }
    }

    /**
     * @summary Get the visibility of the row matching the provided grid row index.
     * @desc Requested row may not be visible due to being outside the bounds of the rendered grid.
     * @summary Determines visibility of a row.
     * @param rowIndex - The grid row index.
     * @returns The given row is visible.
     */
    isRowVisible(rowIndex: number) {
        return !!this.rows[rowIndex];
    }

    /**
     * @summary Get the "visible row" object matching the provided grid row index.
     * @desc Requested row may not be visible due to being outside the bounds of the rendered grid.
     * @summary Find a visible row object.
     * @param rowIndex - The grid row index.
     * @returns The given row if visible or `undefined` if not.
     */
    getVisibleRow(rowIndex: number) {
        return this.rows[rowIndex];
    }

    isDataRowVisible(rowIndex: number, subgrid: Subgrid): boolean {
        return this.getVisibleDataRow(rowIndex, subgrid) !== undefined;
    }

    /**
     * @summary Get the "visible row" object matching the provided data row index.
     * @desc Requested row may not be visible due to being scrolled out of view.
     * @summary Find a visible row object.
     * @param rowIndex - The data row index within the given subgrid.
     * @returns The given row if visible or `undefined` if not.
     */
    getVisibleDataRow(rowIndex: number, subgrid: SubgridInterface) {
        for (const vr of this.rows) {
            if (vr.rowIndex === rowIndex && vr.subgrid === subgrid) {
                return vr;
            }
        }
        return undefined;
    }

    limitRowIndexToViewport(rowIndex: number) {
        const firstScrollableVisibleRowIndex = this.firstScrollableRowIndex;
        if (firstScrollableVisibleRowIndex === undefined) {
            return undefined;
        } else {
            const rows = this.rows;
            const firstScrollableRow = rows[firstScrollableVisibleRowIndex];
            const firstScrollableRowIndex = firstScrollableRow.index;
            if (rowIndex < firstScrollableRowIndex) {
                rowIndex = firstScrollableRowIndex;
            }

            const rowCount = rows.length;
            const lastScrollableVisibleRow = rows[rowCount - 1];
            const lastScrollableVisibleRowIndex = lastScrollableVisibleRow.index;
            if (rowIndex > lastScrollableVisibleRowIndex) {
                rowIndex = lastScrollableVisibleRowIndex;
            }

            return rowIndex;
        }
    }

    calculateLastSelectionBounds(): ViewportCell.Bounds | undefined {
        // should be moved into GridPainter
        const columnCount = this.columns.length;
        const rowCount = this.rows.length;

        if (columnCount === 0 || rowCount === 0) {
            // nothing visible
            return undefined;
        }

        const grid = this.grid;
        const gridProps = grid.properties;
        const selection = grid.selection;

        const selectionArea = selection.lastArea;

        if (selectionArea === undefined) {
            return undefined; // no selection
        } else {
            // todo not sure what this is for; might be defunct logic
            if (selectionArea.topLeft.x === -1) {
                // no selected area, lets exit
                return undefined;
            } else {
                const scrollableColumnRange = this.scrollableColumnRange;
                const scrollableRowRange = this.scrollableRowRange;
                if (scrollableColumnRange === undefined || scrollableRowRange === undefined) {
                    // selection needs scrollable data
                    return undefined;
                } else {
                    let vc: Viewport.ViewportColumn;
                    const vci = this._columnsByIndex;
                    let vr: Viewport.ViewportRow;
                    const vri = this._rowsByDataRowIndex;
                    const lastScrollableColumn = this.columns[columnCount - 1]; // last column in scrollable section
                    const lastScrollableRow = this.rows[rowCount - 1]; // last row in scrollable data section
                    const firstScrollableColumn = vci[scrollableColumnRange.start];
                    const firstScrollableRow = vri.get(scrollableRowRange.start);
                    const fixedColumnCount = gridProps.fixedColumnCount;
                    const fixedRowCount = gridProps.fixedRowCount;
                    const headerRowCount = this._subgridsManager.calculateHeaderRowCount();

                    if (
                        // entire selection scrolled out of view to left of visible columns; or
                        (vc = this.columns[0]) &&
                        selectionArea.exclusiveBottomRight.x < vc.activeColumnIndex ||

                        // entire selection scrolled out of view between fixed columns and scrollable columns; or
                        fixedColumnCount &&
                        (vc = this.columns[fixedColumnCount - 1]) &&
                        selectionArea.topLeft.x > vc.activeColumnIndex &&
                        selectionArea.exclusiveBottomRight.x < firstScrollableColumn.activeColumnIndex ||

                        // entire selection scrolled out of view to right of visible columns; or
                        lastScrollableColumn &&
                        selectionArea.topLeft.x > lastScrollableColumn.activeColumnIndex ||

                        // entire selection scrolled out of view above visible rows; or
                        (vr = this.rows[headerRowCount]) &&
                        selectionArea.exclusiveBottomRight.y < vr.rowIndex ||

                        // entire selection scrolled out of view between fixed rows and scrollable rows; or
                        fixedRowCount &&
                        firstScrollableRow !== undefined &&
                        (vr = this.rows[headerRowCount + fixedRowCount - 1]) &&
                        selectionArea.topLeft.y > vr.rowIndex &&
                        selectionArea.exclusiveBottomRight.y < firstScrollableRow.rowIndex ||

                        // entire selection scrolled out of view below visible rows
                        lastScrollableRow &&
                        selectionArea.topLeft.y > lastScrollableRow.rowIndex
                    ) {
                        return undefined;
                    } else {
                        const vcOrigin = vci[selectionArea.topLeft.x] || firstScrollableColumn;
                        const vrOrigin = vri.get(selectionArea.topLeft.y) || firstScrollableRow;
                        const vcCorner = vci[selectionArea.exclusiveBottomRight.x] || (selectionArea.exclusiveBottomRight.x > lastScrollableColumn.activeColumnIndex ? lastScrollableColumn : vci[fixedColumnCount - 1]);
                        const vrCorner = vri.get(selectionArea.exclusiveBottomRight.y) || (selectionArea.exclusiveBottomRight.y > lastScrollableRow.rowIndex ? lastScrollableRow : vri.get(fixedRowCount - 1));

                        if (!(vcOrigin && vrOrigin && vcCorner && vrCorner)) {
                            return undefined;
                        } else {
                            const bounds: ViewportCell.Bounds = {
                                x: vcOrigin.left,
                                y: vrOrigin.top,
                                width: vcCorner.rightPlus1 - vcOrigin.left,
                                height: vrCorner.bottom - vrOrigin.top
                            };

                            return bounds;
                        }
                    }
                }
            }
        }
    }

    /**
     * @returns Current vertical scroll value.
     */
    getScrollTop(): number {
        return this.grid.rowScrollAnchorIndex;
    }

    /**
     * @returns The last col was rendered (is visible)
     */
    isLastColumnVisible(): boolean {
        const lastColumnIndex = this._columnsManager.getActiveColumnCount() - 1;
        return !!this.columns.find((vc) => { return vc.activeColumnIndex === lastColumnIndex; });
    }

    /**
     * @returns The rendered column width at index
     */
    getRenderedWidth(index: number) {
        const columns = this.columns;
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
        const rows = this.rows;
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
     * @returns The row to go to for a page up.
     */
    getPageUpRow(): number | undefined {
        const scrollableRowRange = this.scrollableColumnRange;
        if (scrollableRowRange === undefined) {
            return undefined;
        } else {
            const scrollHeight = this.getVisibleScrollHeight();
            let top = scrollableRowRange.start - this.properties.fixedRowCount - 1;
            let scanHeight = 0;
            while (scanHeight < scrollHeight && top >= 0) {
                scanHeight += this._getRowHeightEventer(top, undefined);
                top--;
            }
            return top + 1;
        }
    }

    /**
     * @returns The row to goto for a page down.
     */
    getPageDownRow(): number | undefined {
        const scrollableRowRange = this.scrollableColumnRange;
        if (scrollableRowRange === undefined) {
            return undefined;
        } else {
            return scrollableRowRange.after - this.properties.fixedRowCount;
        }
    }

    /**
     * This function creates several data structures:
     * * {@link Viewport#columns}
     * * {@link Viewport#rows}
     *
     * Original comment:
     * "this function computes the grid coordinates used for extremely fast iteration over
     * painting the grid cells. this function is very fast, for thousand rows X 100 columns
     * on a modest machine taking usually 0ms and no more that 3 ms."
     *
     * @this {Viewport}
     */
    internalComputeCellsBounds() {
        const scrollTop = this.getScrollTop();
        const columnScrollAnchorIndex = this._columnScrollAnchorIndex;
        const columnScrollAnchorOffset = this._columnScrollAnchorOffset;

        const grid = this.grid;
        const columnsManager = this._columnsManager;
        const columns = this.columns;
        const leftMostColIndex = 0;

        const editorCellEvent = grid.cellEditor && grid.cellEditor.viewportCell;

        let vcEd: Viewport.ViewportColumn | undefined;
        let xEd: number | undefined;
        let vrEd: Viewport.ViewportRow | undefined;
        let yEd: number | undefined;
        let sgEd: SubgridInterface | undefined;
        let isSubgridEd: boolean;

        let insertionBoundsCursor = 0;
        let previousInsertionBoundsCursorValue = 0;

        const gridProps = this._gridProperties;
        // const borderBox = gridProps.boxSizing === 'border-box';
        const gridRightAligned = gridProps.gridRightAligned;
        const visibleColumnWidthAdjust = gridProps.visibleColumnWidthAdjust;

        const lineWidthV = gridProps.gridLinesVWidth;
        const lineGapV = lineWidthV;

        const fixedColumnCount = this._columnsManager.getFixedColumnCount();
        const lastFixedColumnIndex = fixedColumnCount - 1;

        let fixedWidthV: number;
        let vc: Viewport.ViewportColumn;
        let firstVX: number | undefined;
        let lastVX: number | undefined;

        if (editorCellEvent) {
            xEd = editorCellEvent.gridCell.x;
            yEd = editorCellEvent.dataCell.y;
            sgEd = editorCellEvent.subgrid;
        }

        if (gridProps.fixedLinesVWidth === undefined) {
            fixedWidthV = lineWidthV;
        } else {
            fixedWidthV = gridProps.fixedLinesVWidth;
        }

        columns.length = 0;
        columns.gap = undefined;

        this._columnsByIndex.length = 0;
        this._rowsByDataRowIndex.clear();

        this._insertionBounds.length = 0;

        const gridBounds = this._canvasEx.bounds;
        const gridWidth = gridBounds.width; // horizontal pixel loop limit
        const gridHeight = gridBounds.height; // horizontal pixel loop limit
        const activeColumnCount = this._columnsManager.getActiveColumnCount();

        let startX: number; // horizontal pixel loop index
        let start: number; // first visible index
        if (!gridRightAligned || columnScrollAnchorIndex < fixedColumnCount) {
            startX = 0;
            start = leftMostColIndex;
        } else {
            // We want to right align the grid in the canvas.  The last column (after scrolling) is always visible.  Work backwards to see which
            // column is the first visible and what its x position is.
            startX = gridWidth; // horizontal pixel loop index
            start = columnScrollAnchorIndex + 1;

            do {
                start--;

                if (start < activeColumnCount) {
                    if (start === lastFixedColumnIndex) {
                        startX = startX - fixedWidthV;
                    } else {
                        if (startX !== gridWidth) {
                            // not right most
                            startX = startX - lineGapV;
                        }
                    }
                    let width = Math.ceil(columnsManager.getActiveColumnWidth(start));
                    if (start === this._columnScrollAnchorIndex && columnScrollAnchorOffset > 0) {
                        width -= columnScrollAnchorOffset;
                        if (width < 0) {
                            width = 0;
                        }
                    }
                    startX = startX - width;
                }

            } while (start > leftMostColIndex && startX > 0)

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
        columns.length = activeColumnCount - start; // maximum length
        let x = startX;
        let nonFixedStartX = startX;
        let vcIndex = 0;
        let isFirstNonFixedColumn = start >= fixedColumnCount;
        this._firstScrollableColumnIndex = undefined;
        this._unanchoredColumnOverflow = undefined;
        let fixedColumnsViewWidth = 0;
        let scrollableColumnsViewWidth = 0;
        let fixedNonFixedBorderWidth = 0;
        let gapLeft: number | undefined;
        for (let c = start; c < activeColumnCount; c++) {
            if (x >= gridWidth) {
                columns.length = vcIndex;
                break; // no space left
            } else {
                if (c === fixedColumnCount) {
                    isFirstNonFixedColumn = true;
                }
                if (gridRightAligned || c < fixedColumnCount || c >= columnScrollAnchorIndex) {
                    const activeColumnWidth = columnsManager.getActiveColumnWidth(c);
                    let left: number;
                    let activeColumnOrAnchoredWidth = columnsManager.getActiveColumnWidth(c);
                    if (c === columnScrollAnchorIndex) {
                        activeColumnOrAnchoredWidth = activeColumnWidth - columnScrollAnchorOffset;
                        if (gridRightAligned) {
                            left = x;
                        } else {
                            left = x - columnScrollAnchorOffset;
                        }
                    } else {
                        activeColumnOrAnchoredWidth = activeColumnWidth;
                        left = x;
                    }

                    let visibleWidth: number;
                    if (!isFirstNonFixedColumn) {
                        visibleWidth = activeColumnWidth;
                    } else {
                        this._firstScrollableColumnIndex = vcIndex;
                        if (gridRightAligned) {
                            if (left < 0) {
                                this._unanchoredColumnOverflow = -left; // left is negative
                                if (visibleColumnWidthAdjust) {
                                    visibleWidth = activeColumnWidth + left;
                                    left = 0;
                                } else {
                                    visibleWidth = activeColumnWidth;
                                }
                            } else {
                                this._unanchoredColumnOverflow = 0;
                                visibleWidth = activeColumnWidth;
                            }
                        } else {
                            if (left < x) {
                                const offset = x - left;
                                if (visibleColumnWidthAdjust) {
                                    left = x;
                                    visibleWidth = activeColumnWidth - offset;
                                } else {
                                    visibleWidth = activeColumnWidth;
                                }
                            } else {
                                visibleWidth = activeColumnWidth;
                            }
                        }
                    }
                    // if (visibleColumnWidthAdjust) {
                    //     if (gridRightAligned) {
                    //         if (isFirstNonFixedColumn && left < 0) {
                    //             visibleWidth += left;
                    //             left = 0;
                    //         }
                    //     } else {
                    //         if (isFirstNonFixedColumn && left < firstNonFixedColumnLeft) {
                    //             visibleWidth -= (firstNonFixedColumnLeft - left);
                    //             left = firstNonFixedColumnLeft;
                    //         }
                    //     }
                    //     if (left + visibleWidth > gridWidth) {
                    //         visibleWidth = gridWidth - left;
                    //     }
                    // }
                    visibleWidth = Math.floor(visibleWidth);

                    const rightPlus1 = left + visibleWidth;

                    columns[vcIndex] = this._columnsByIndex[c] = vc = {
                        index: vcIndex,
                        activeColumnIndex: c,
                        activeColumn: columnsManager.getActiveColumn(c),
                        left,
                        width: visibleWidth,
                        rightPlus1
                    };

                    if (xEd === c) {
                        vcEd = vc;
                    }

                    const isNonFixedColumn = c >= fixedColumnCount;

                    if (isNonFixedColumn) {
                        if (gapLeft !== undefined) {
                            // first non fixed column after fixed column
                            columns.gap = {
                                left: gapLeft, // from previous loop
                                rightPlus1: vc.left
                            };
                            gapLeft = undefined;
                            fixedNonFixedBorderWidth = fixedWidthV;
                        }

                        lastVX = c;
                        if (firstVX === undefined) {
                            firstVX = lastVX;
                        }

                        if (isFirstNonFixedColumn) {
                            isFirstNonFixedColumn = false;
                        }
                    }

                    x = x + activeColumnOrAnchoredWidth;
                    if (c === lastFixedColumnIndex) {
                        fixedColumnsViewWidth = x - startX;
                        gapLeft = x; // for next loop
                        x = x + fixedWidthV;
                        nonFixedStartX = x;
                    } else {
                        x = x + lineGapV;
                    }

                    vcIndex++;

                    insertionBoundsCursor += Math.round(visibleWidth / 2) + previousInsertionBoundsCursorValue;
                    this._insertionBounds.push(insertionBoundsCursor);
                    previousInsertionBoundsCursorValue = Math.round(visibleWidth / 2);
                }
            }
        }
        const visibleColumnCount = columns.length;
        if (visibleColumnCount > 0) {
            const lastVisibleColumnIndex = visibleColumnCount - 1;
            const lastVisibleColumn = columns[lastVisibleColumnIndex];
            const lastVisibleColumnLeft = lastVisibleColumn.left;
            const lastVisibleColumnOriginalAfterLeft = lastVisibleColumnLeft + lastVisibleColumn.width;
            if (lastVisibleColumnOriginalAfterLeft > gridWidth) {
                const overflow = lastVisibleColumnOriginalAfterLeft - gridWidth;
                if (visibleColumnWidthAdjust) {
                    lastVisibleColumn.width -= overflow;
                }

                if (!gridRightAligned) {
                    this._unanchoredColumnOverflow = overflow;
                }

                scrollableColumnsViewWidth = lastVisibleColumnLeft + lastVisibleColumn.width - nonFixedStartX;
            } else {
                if (lastVisibleColumnOriginalAfterLeft === gridWidth) {
                    if (!gridRightAligned) {
                        this._unanchoredColumnOverflow = 0;
                    }
                }
                scrollableColumnsViewWidth = lastVisibleColumnOriginalAfterLeft - nonFixedStartX;
            }
            if (lastVisibleColumn.activeColumnIndex >= fixedColumnCount) {
                this._lastScrollableColumnIndex = lastVisibleColumnIndex;
            } else {
                this._lastScrollableColumnIndex = undefined;
            }
        } else {
            scrollableColumnsViewWidth = gridWidth - nonFixedStartX; // may include last grid line
        }

        const rows = this.rows;
        const subgrids = this._subgridsManager.subgrids;

        const headerPlusFixedRowCount = this._subgridsManager.calculateHeaderPlusFixedRowCount();
        // get height of total number of rows in all subgrids following the data subgrid
        const footerHeight = gridProps.defaultRowHeight * this._subgridsManager.calculateFooterRowCount();
        const lineWidthH = gridProps.gridLinesHWidth;
        const lineGapH = lineWidthH;
        const lastFixedRowIndex = headerPlusFixedRowCount - 1;

        rows.length = 0;
        rows.gap = undefined;

        let height: number;
        let subrows: number; // rows in subgrid
        let firstVY: number | undefined;
        let lastVY: number | undefined;
        let fixedGapH: number;
        let fixedOverlapH: number;
        let subgrid: Subgrid;
        let rowIndex: number;
        let vy: number;
        let vr: Viewport.ViewportRow;

        if (gridProps.fixedLinesHWidth === undefined) {
            fixedGapH = lineWidthH;
            fixedOverlapH = 0;
        } else {
            const fixedWidthH = Math.max(gridProps.fixedLinesHWidth, lineWidthH);
            fixedGapH = fixedWidthH; // hangover from borderBox
            fixedOverlapH = fixedGapH - fixedWidthH;
        }

        let gapTop: number | undefined;
        let base = 0; // sum of rows for all subgrids so far
        let y = 0; // vertical pixel loop index and limit
        const Y = gridHeight - footerHeight; // vertical pixel loop index and limit
        const subgridCount = subgrids.length; // subgrid loop index and limit
        let isMainSubgrid = false;
        let r = 0; // row loop index
        this._firstScrollableRowIndex = undefined;
        this._lastScrollableRowIndex = undefined;
        for (let subgridIndex = 0; subgridIndex < subgridCount; subgridIndex++, base += subrows) {
            subgrid = subgrids[subgridIndex];
            subrows = subgrid.getRowCount();
            isMainSubgrid = subgrid.isMain;
            isSubgridEd = (sgEd === subgrid);
            const topR = r;

            // For each row of each subgrid...
            const R = r + subrows; // row loop limit
            for (; r < R && y < Y; r++) {
                vy = r;
                if (isMainSubgrid && r >= headerPlusFixedRowCount) {
                    vy += scrollTop;
                    lastVY = vy - base;
                    if (firstVY === undefined) {
                        firstVY = lastVY;
                    }
                    if (vy >= R) {
                        break; // scrolled beyond last row
                    }

                    if (this._firstScrollableRowIndex === undefined) {
                        this._firstScrollableRowIndex = r;
                    }
                }

                rowIndex = vy - base;
                height = this._getRowHeightEventer(rowIndex, subgrid);

                this.rows[r] = vr = {
                    index: r,
                    rowIndex: rowIndex,
                    subgrid: subgrid,
                    top: y,
                    height: height,
                    bottom: y + height
                };

                if (gapTop !== undefined) {
                    this.rows.gap = {
                        top: gapTop,
                        bottom: vr.top,
                    };
                    gapTop = undefined;
                }

                if (isMainSubgrid) {
                    this._rowsByDataRowIndex.set(vy - base, vr);
                }

                if (isSubgridEd && yEd === rowIndex) {
                    vrEd = vr;
                }

                y += height;

                if (r === lastFixedRowIndex) {
                    gapTop = vr.bottom + fixedOverlapH;
                    y += fixedGapH;
                } else {
                    y += lineGapH;
                }
            }

            if (isMainSubgrid) {
                subrows = r - topR;
                if (subrows > 0) {
                    // at lease one row in main subgrid
                    this._lastScrollableRowIndex = r - 1;
                }
            }
        }

        if (editorCellEvent && vcEd !== undefined && vrEd !== undefined) {
            editorCellEvent.visibleColumn = vcEd;
            editorCellEvent.visibleRow = vrEd;
            editorCellEvent.gridCell.y = vrEd && vrEd.index;
            editorCellEvent._bounds = undefined;
        }

        if (firstVX === undefined || lastVX === undefined) {
            this.scrollableColumnRange = undefined;
        } else {
            const length = Math.min(lastVX - firstVX + 1, columns.length);
            this.scrollableColumnRange = new ContiguousIndexRange(firstVX, length);
        }

        if (firstVY === undefined || lastVY === undefined) {
            this.scrollableRowRange = undefined;
        } else {
            const length = Math.min(lastVY - firstVY + 1, this.rows.length);
            this.scrollableRowRange = new ContiguousIndexRange(firstVY, length);
        }

        // Resize CellEvent pool
        const pool = this.cellPool;
        const previousLength = pool.length;
        const P = columns.length * this.rows.length;

        if (P > previousLength) {
            pool.length = P; // grow pool to accommodate more cells
        }
        for (let p = previousLength; p < P; p++) {
            pool[p] = new ViewportCell(this.grid); // instantiate extra required - all real BeingPaintedCell (and CellEvent) objects are created here
        }
        this._cellPoolOrder = undefined;

        this.updateColumnsViewWidths(fixedColumnsViewWidth, scrollableColumnsViewWidth, fixedNonFixedBorderWidth);

        this._valid = true;
        this.computedEventer();
    }

    private updateColumnsViewWidths(fixedColumnsViewWidth: number, scrollableColumnsViewWidth: number, fixedNonFixedBorderWidth: number) {
        const columnsViewWidth = fixedColumnsViewWidth + scrollableColumnsViewWidth + fixedNonFixedBorderWidth;

        let fixedColumnsViewWidthChanged: boolean;
        if (fixedColumnsViewWidth === this._fixedColumnsViewWidth) {
            fixedColumnsViewWidthChanged = false;
        } else {
            this._fixedColumnsViewWidth = fixedColumnsViewWidth;
            fixedColumnsViewWidthChanged = true;
        }

        let scrollableColumnsViewWidthChanged: boolean;
        if (scrollableColumnsViewWidth === this._scrollableColumnsViewWidth) {
            scrollableColumnsViewWidthChanged = false;
        } else {
            this._scrollableColumnsViewWidth = scrollableColumnsViewWidth;
            scrollableColumnsViewWidthChanged = true;
        }

        let columnsViewWidthChanged: boolean;
        if (columnsViewWidth === this._columnsViewWidth) {
            columnsViewWidthChanged = false;
        } else {
            this._columnsViewWidth = columnsViewWidth;
            columnsViewWidthChanged = true;
        }

        if (fixedColumnsViewWidthChanged || scrollableColumnsViewWidthChanged || columnsViewWidthChanged) {
            const detail: EventDetail.ColumnsViewWidthsChanged = {
                fixedChanged: fixedColumnsViewWidthChanged,
                scrollableChanged: scrollableColumnsViewWidthChanged,
                visibleChanged: columnsViewWidthChanged,
            };
            this.grid.fireSyntheticColumnsViewWidthsChangedEvent(detail);
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
    findCell(colIndexOrCellEvent: number | ViewportCell, rowIndex?: number, subgrid?: SubgridInterface) {
        let colIndex: number;
        const pool = this.cellPool;

        if (typeof colIndexOrCellEvent === 'object') {
            // colIndexOrCellEvent is a cell event object
            subgrid = colIndexOrCellEvent.subgrid;
            rowIndex = colIndexOrCellEvent.dataCell.y;
            colIndex = colIndexOrCellEvent.dataCell.x;
        } else {
            colIndex = colIndexOrCellEvent;
        }

        if (subgrid === undefined) {
            subgrid = this._mainSubgrid;
        }

        let len = this.columns.length;
        len *= this.rows.length;
        for (let p = 0; p < len; ++p) {
            const cell = pool[p];
            if (
                cell.subgrid === subgrid &&
                cell.dataCell.x === colIndex &&
                cell.dataCell.y === rowIndex
            ) {
                return cell;
            }
        }
        return undefined;
    }

    findCellAt(columnIndex: number, rowIndex: number) {
        switch (this._cellPoolOrder) {
            case Viewport.CellPoolOrder.ColumnRow: {
                const poolIndex = columnIndex * this.columns.length + rowIndex;
                return this.cellPool[poolIndex];
            }
            case Viewport.CellPoolOrder.RowColumn: {
                const poolIndex = rowIndex * this.rows.length + columnIndex;
                return this.cellPool[poolIndex];
            }
            case undefined: {
                const pool = this.cellPool;
                const cellCount = pool.length;
                for (let p = 0; p < cellCount; p++) {
                    const cell = pool[p];
                    const gridCell = cell.gridCell;
                    if (gridCell.x === columnIndex && gridCell.y === rowIndex) {
                        return cell;
                    }
                }
                throw new AssertError('VFCAC87874');
            }
            default:
                throw new UnreachableCaseError('FVCAU878974', this._cellPoolOrder);
        }
    }

    /**
     * Resets the cell properties cache in the matching `CellEvent` object from the renderer's pool. This will insure that a new cell properties object will be known to the renderer. (Normally, the cache is not reset until the pool is updated by the next call to {@link Viewport#computeCellBounds}).
     */
    resetCellPropertiesCache(xOrCellEvent: number | ViewportCell, y?: number, subgrid?: Subgrid) {
        const beingPaintedCell = this.findCell(xOrCellEvent, y, subgrid);
        if (beingPaintedCell) {
            beingPaintedCell.clearCellOwnProperties();
        }
    }

    resetAllCellPropertiesCaches() {
        this.cellPool.forEach((cellEvent) => {
            cellEvent.clearCellOwnProperties();
        });
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
     * When `grid.properties.fetchSubregions` is falsy, this function merely returns scrollable rectangle as the only rectangle.
     * This is way more efficient than calling `getSubrects` (as it is currently implemented) and is fine so long as there are no fixed columns or rows and column re-ordering is disabled.
     * (If tree column in use, it is a fixed column, but this is workable so long as the data model knows to always return it regardless of rectangle.)
     * Hidden columns within the range of visible columns will be fetched anyway.
     * Column scrolling is ok.
     *
     * @ToDo This function is too slow for practical use due to map and sort.
     *
     * @this {Viewport}
     */
    private getSubrects(): undefined | RectangleInterface[] {
        const scrollableColumnRange = this.scrollableColumnRange;
        const scrollableRowRange = this.scrollableRowRange;
        if (scrollableColumnRange === undefined || scrollableRowRange === undefined) {
            return undefined;
        } else {
            if (!this._gridProperties.fetchSubregions) {
                return [{
                    x: scrollableColumnRange.start,
                    y: scrollableRowRange.start,
                    width: scrollableColumnRange.length,
                    height: scrollableColumnRange.length,
                }];
            } else {
                const orderedColumnIndexes = this.columns.map(
                    (vc) => vc.activeColumn.index
                ).sort(
                    (a, b) => { return a - b; }
                );
                const xMin = orderedColumnIndexes[0];
                const width = orderedColumnIndexes[orderedColumnIndexes.length - 1] - xMin + 1;

                return [new Rectangle(xMin, scrollableRowRange.start, width, scrollableRowRange.length)];
            }
        }
    }
}

export namespace Viewport {
    export type GetRowHeightEventer = (this: void, y: number, subgrid: Subgrid | undefined) => number;
    export type CheckNeedsShapeChangedEventer = (this: void) => void;
    export type ComputedEventer = (this: void) => void;

    export const enum CellPoolOrder {
        ColumnRow,
        RowColumn,
    }

    export interface ViewportColumn {
        /** A back reference to the element's array index in {@link Viewport#columns}. */
        index: number;
        /** Dereferences {@link Behavior#columns}, the subset of _active_ columns, specifying which column to show in that position. */
        activeColumnIndex: number;
        activeColumn: ColumnInterface;
        /** Pixel coordinate of the left edge of this column, rounded to nearest integer. */
        left: number;
        /** Pixel coordinate of the right edge of this column + 1, rounded to nearest integer. */
        rightPlus1: number;
        /** Width of this column in pixels, rounded to nearest integer. */
        width: number;
    }

    export class ViewportColumnArray extends Array<ViewportColumn> {
        gap: ViewportColumnArray.Gap | undefined;
    }

    export namespace ViewportColumnArray {
        export interface Gap {
            left: number;
            rightPlus1: number;
        }
    }

    export interface ViewportRow {
        /** A back reference to the element's array index in {@link Viewport#rows}. */
        index: number;
        /** Local vertical row coordinate within the subgrid to which the row belongs, adjusted for scrolling. */
        rowIndex: number;
        /** The subgrid to which the row belongs. */
        subgrid: SubgridInterface;
        /** Pixel coordinate of the top edge of this row, rounded to nearest integer. */
        top: number;
        /** Pixel coordinate of the bottom edge of this row, rounded to nearest integer. */
        bottom: number;
        /** Height of this row in pixels, rounded to nearest integer. */
        height: number;
    }

    export class ViewportRowArray extends Array<ViewportRow> {
        gap: ViewportRowArray.Gap | undefined;
    }

    export namespace ViewportRowArray {
        export interface Gap {
            top: number;
            bottom: number;
        }
    }

    export interface Bounds {
        width: number;
        height: number;
    }

    export class SubrowsValue extends Array<unknown> {
        subrows: unknown;
    }

    export interface ScrollAnchor {
        index: number; // Index of column/row
        offset: number; // number of pixels anchor is offset in current column/row
    }

    export interface ScrollAnchorLimits {
        startAnchorLimitIndex: number;
        startAnchorLimitOffset: number;
        finishAnchorLimitIndex: number;
        finishAnchorLimitOffset: number;
    }

    export interface ScrollContentSizeAndAnchorLimits {
        contentSize: number;
        contentOverflowed: boolean;
        anchorLimits: ScrollAnchorLimits;
    }
}
