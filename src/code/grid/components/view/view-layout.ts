import { CanvasEx } from '../../components/canvas-ex/canvas-ex';
import { DataModel } from '../../interfaces/data-model';
import { GridSettings } from '../../interfaces/grid-settings';
import { SubgridInterface } from '../../interfaces/subgrid-interface';
import { ViewLayoutColumn } from '../../interfaces/view-layout-column';
import { ViewLayoutRow } from '../../interfaces/view-layout-row';
import { Rectangle } from '../../lib/rectangle';
import { RectangleInterface } from '../../lib/rectangle-interface';
import { AssertError, UnreachableCaseError } from '../../lib/revgrid-error';
import { HorizontalVertical } from '../../lib/types';
import { ViewCell } from '../cell/view-cell';
import { Column } from '../column/column';
import { ColumnsManager } from '../column/columns-manager';
import { Selection } from '../selection/selection';
import { Subgrid } from '../subgrid/subgrid';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { HorizontalScrollDimension } from './horizontal-scroll-dimension';
import { ScrollDimension } from './scroll-dimension';
import { VerticalScrollDimension } from './vertical-scroll-dimension';


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
 * Same parameters as {@link ViewLayout#initialize|initialize}, which is called by this constructor.
 *
 */
export class ViewLayout {
    invalidatedEventer: ViewLayout.InvalidatedEventer;
    columnsViewWidthsChangedEventer: ViewLayout.ColumnsViewWidthsChangedEventer;

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
    private readonly _columns = new ViewLayout.ViewLayoutColumnArray();

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
    private readonly _rows = new ViewLayout.ViewLayoutRowArray();

    private readonly _horizontalScrollDimension: HorizontalScrollDimension;
    private readonly _verticalScrollDimension: VerticalScrollDimension;

    private readonly _dummyUnusedColumn: Column;

    private readonly _rowColumnOrderedCellPool = new Array<ViewCell>();
    private readonly _columnRowOrderedCellPool = new Array<ViewCell>();

    private _columnsValid = false;
    private _rowsValid = false;

    private _rowsColumnsComputationId = 0;
    private _rowColumnOrderedCellPoolComputationId = 0;
    private _columnRowOrderedCellPoolComputationId = 0;

    private _mainSubgrid: Subgrid;

    private _columnsByIndex = new Array<ViewLayoutColumn>();  // array because number of columns will always be reasonable
    private _rowsByDataRowIndex = new Map<number, ViewLayoutRow>(); // hash because keyed by (fixed and) scrolled row indexes

    // I don't think this is used
    private _insertionBounds = new Array<number>();

    // Specifies the index of the column anchored to the bounds edge
    // Will be first non-fixed visible column or last visible column depending on the gridRightAligned property
    // Set to -1 if there is no space scrollable columns (ie only space for fixed columns)
    private _columnScrollAnchorIndex: number;
    // Specifies the number of pixels of the anchored column which have been scrolled off the view
    private _columnScrollAnchorOffset: number;

    // Specifies the number of pixels the column at the opposite end of the anchored column has off the view
    // This value will be:
    // * undefined if unanchored column does not reach the end of the view.
    // * 0 if the unanchored column is touches the edge of the view with no overflow
    // * Positive number which specifies the number of pixels the column overflows the grid on the unanchored side
    private _unanchoredColumnOverflow: number | undefined;


    // Index of the first scrollable column in VisibleColumns
    private _firstScrollableColumnIndex: number | undefined;
    private _lastScrollableColumnIndex: number | undefined;

    private _fixedColumnsViewWidth = 0;
    private _scrollableColumnsViewWidth = 0;
    private _columnsViewWidth = 0;

    private _rowScrollAnchorIndex = 0;
    private _rowScrollAnchorOffset = 0;

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

    constructor(
        private readonly _gridSettings: GridSettings,
        private readonly _canvasEx: CanvasEx,
        private readonly _columnsManager: ColumnsManager,
        private readonly _subgridsManager: SubgridsManager,
        private readonly _selection: Selection,
        horizontalScrollViewportStartChangedEventer: ScrollDimension.ViewportStartChangedEventer,
        verticalScrollViewportStartChangedEventer: ScrollDimension.ViewportStartChangedEventer,
    ) {
        this._horizontalScrollDimension = new HorizontalScrollDimension(this._gridSettings, this._canvasEx, this._columnsManager, horizontalScrollViewportStartChangedEventer);
        this._horizontalScrollDimension.computedEventer = (withinAnimationFrame) => this.handleHorizontalScrollDimensionComputedEvent(withinAnimationFrame);
        this._verticalScrollDimension = new VerticalScrollDimension(this._gridSettings, this._canvasEx, this._subgridsManager, verticalScrollViewportStartChangedEventer);
        this._verticalScrollDimension.computedEventer = (withinAnimationFrame) => this.handleVerticalScrollDimensionComputedEvent(withinAnimationFrame);

        this._dummyUnusedColumn = this._columnsManager.createDummyColumn();
        this._columnsManager.invalidateViewEventer = (scrollablePlaneDimensionAsWell) => this.invalidateHorizontalAll(scrollablePlaneDimensionAsWell);
        this._mainSubgrid = this._subgridsManager.mainSubgrid;
        this.reset();
    }

    get columns() {
        this.ensureHorizontalValid();
        return this._columns;
    }

    get rows() {
        this.ensureVerticalValid();
        return this._rows;
    }

    get rowsColumnsComputationId() { return this._rowsColumnsComputationId; }

    get horizontalScrollDimension() {
        this.ensureHorizontalValid();
        return this._horizontalScrollDimension;
    }

    get verticalScrollDimension() {
        this.ensureVerticalValid();
        return this._verticalScrollDimension;
    }

    get horizontalScrollableOverflowed() {
        this.ensureHorizontalValid();
        return this._horizontalScrollDimension.overflowed;
    }

    get columnScrollAnchorIndex() {
        this.ensureHorizontalValid();
        return this._columnScrollAnchorIndex;
    }
    get columnScrollAnchorOffset() {
        this.ensureHorizontalValid();
        return this._columnScrollAnchorOffset;
    }

    get unanchoredColumnOverflow() {
        this.ensureHorizontalValid();
        return this._unanchoredColumnOverflow;
    }

    get firstScrollableColumnIndex() {
        this.ensureHorizontalValid();
        return this._firstScrollableColumnIndex;
    }
    get firstScrollableColumn() {
        this.ensureHorizontalValid();
        const firstScrollableColumnIndex = this._firstScrollableColumnIndex;
        if (firstScrollableColumnIndex === undefined) {
            return undefined;
        } else {
            return this._columns[firstScrollableColumnIndex];
        }
    }
    get firstScrollableActiveColumnIndex() {
        this.ensureHorizontalValid();
        const firstScrollableColumnIndex = this._firstScrollableColumnIndex;
        if (firstScrollableColumnIndex === undefined) {
            return undefined;
        } else {
            return this._columns[firstScrollableColumnIndex].activeColumnIndex;
        }
    }
    get firstScrollableColumnLeftOverflow(): number | undefined {
        this.ensureHorizontalValid();
        const firstScrollableVisibleColumnIndex = this._firstScrollableColumnIndex;
        if (firstScrollableVisibleColumnIndex === undefined) {
            return undefined;
        } else {
            if (this._gridSettings.gridRightAligned) {
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
        this.ensureHorizontalValid();
        const lastScrollableColumnIndex = this._lastScrollableColumnIndex;
        if (lastScrollableColumnIndex === undefined) {
            return undefined;
        } else {
            return this._columns[lastScrollableColumnIndex].activeColumnIndex;
        }
    }
    get lastScrollableColumnRightOverflow(): number | undefined {
        this.ensureHorizontalValid();
        const lastScrollableColumnIndex = this._lastScrollableColumnIndex;
        if (lastScrollableColumnIndex === undefined) {
            return undefined;
        } else {
            if (this._gridSettings.gridRightAligned) {
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

    get fixedColumnsViewWidth() {
        this.ensureHorizontalValid();
        return this._fixedColumnsViewWidth;
    }
    get scrollableColumnsViewWidth() {
        this.ensureHorizontalValid();
        return this._scrollableColumnsViewWidth;
    }
    get columnsViewWidth() {
        this.ensureHorizontalValid();
        return this._columnsViewWidth;
    }

    get rowScrollAnchorIndex() {
        this.ensureVerticalValid();
        return this._rowScrollAnchorIndex;
    }
    get firstScrollableRowIndex() {
        this.ensureVerticalValid();
        return this._firstScrollableRowIndex;
    }
    get firstScrollableSubgridRowIndex() {
        this.ensureVerticalValid();
        const firstScrollableRowIndex = this._firstScrollableRowIndex;
        if (firstScrollableRowIndex === undefined) {
            return undefined;
        } else {
            return this._rows[firstScrollableRowIndex].subgridRowIndex;
        }
    }
    get firstScrollableRowViewTop() {
        this.ensureVerticalValid();
        const firstScrollableRowIndex = this._firstScrollableRowIndex;
        if (firstScrollableRowIndex === undefined) {
            return undefined
        } else {
            return this._rows[firstScrollableRowIndex].top;
        }
    }

    get lastScrollableRowIndex() {
        this.ensureVerticalValid();
        return this._lastScrollableRowIndex;
    }
    get lastScrollableSubgridRowIndex() {
        this.ensureVerticalValid();
        const lastScrollableRowIndex = this._lastScrollableRowIndex;
        if (lastScrollableRowIndex === undefined) {
            return undefined;
        } else {
            return this._rows[lastScrollableRowIndex].subgridRowIndex;
        }
    }

    get scrollableCanvasLeft(): number | undefined {
        if (this._horizontalScrollDimension.exists) {
            return this._horizontalScrollDimension.start;
        } else {
            return undefined;
        }
    }

    get scrollableCanvasBounds(): Rectangle | undefined {
        if (!this._horizontalScrollDimension.exists) {
            return undefined;
        } else {
            const x = this._horizontalScrollDimension.start;
            const y = this.firstScrollableRowViewTop;
            if (y === undefined) {
                return undefined;
            } else {
                const width = this._horizontalScrollDimension.size;
                const height = this._canvasEx.bounds.y - y; // this does not handle situation where rows do not fill the view
                return new Rectangle(x, y, width, height);
            }
        }
    }

    get firstScrollableVisibleColumnMaximallyVisible() {
        this.ensureHorizontalValid();
        if (this._gridSettings.gridRightAligned) {
            return this._unanchoredColumnOverflow === undefined || this._unanchoredColumnOverflow === 0;
        } else {
            return this._columnScrollAnchorOffset === 0;
        }
    }

    get lastScrollableVisibleColumnMaximallyVisible() {
        this.ensureHorizontalValid();
        if (this._gridSettings.gridRightAligned) {
            return this._columnScrollAnchorOffset === 0;
        } else {
            return this._unanchoredColumnOverflow === undefined || this._unanchoredColumnOverflow === 0;
        }
    }

    getRowColumnOrderedCellPool() {
        const pool = this._rowColumnOrderedCellPool;
        if (this._rowColumnOrderedCellPoolComputationId !== this._rowsColumnsComputationId) {
            const rows = this._rows;
            const rowCount = rows.length;
            const columns = this._columns;
            const columnCount = columns.length;

            this.resizeCellPool(pool, columnCount * rowCount);

            let poolIndex = 0;
            for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                const row = rows[rowIndex];
                for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                    const column = columns[columnIndex];
                    poolIndex++;
                    pool[poolIndex++].reset(column, row);
                }
            }
            this._rowColumnOrderedCellPoolComputationId = this._rowsColumnsComputationId;
        }

        return pool;
    }

    getColumnRowOrderedCellPool() {
        const pool = this._columnRowOrderedCellPool;
        if (this._columnRowOrderedCellPoolComputationId !== this._rowsColumnsComputationId) {
            const rows = this._rows;
            const rowCount = rows.length;
            const columns = this._columns;
            const columnCount = columns.length;

            this.resizeCellPool(pool, columnCount * rowCount);

            let poolIndex = 0;
            for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                const column = columns[columnIndex];
                for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                    const row = rows[rowIndex];
                    poolIndex++;
                    pool[poolIndex++].reset(column, row);
                }
            }
            this._columnRowOrderedCellPoolComputationId = this._rowsColumnsComputationId;
        }

        return pool;
    }

    reset() {
        this._columns.length = 0;
        this._rows.length = 0;
        this._columnRowOrderedCellPool.length = 0;
        this._rowColumnOrderedCellPool.length = 0;

        this._insertionBounds.length = 0;

        this._rowColumnOrderedCellPoolComputationId = -1;
        this._columnRowOrderedCellPoolComputationId = -1;

        this._rowScrollAnchorIndex = 0;

        this._columnsValid = false;
        this._rowsValid = false;

        this._horizontalScrollDimension.reset();
        this._verticalScrollDimension.reset();

        this._columnScrollAnchorIndex = 0;
        this._columnScrollAnchorOffset = 0;
    }

    invalidate(action: ViewLayout.InvalidateAction) {
        // in the future, may want to do more with action
        const scrollablePlaneDimensionAsWell = action.scrollDimensionAsWell;
        switch (action.dimension) {
            case HorizontalVertical.Horizontal: {
                if (scrollablePlaneDimensionAsWell) {
                    this._horizontalScrollDimension.invalidate();
                }
                this._columnsValid = false;
                break;
            }
            case HorizontalVertical.Vertical: {
                if (scrollablePlaneDimensionAsWell) {
                    this._verticalScrollDimension.invalidate();
                }
                this._rowsValid = false;
                break;
            }
            case undefined: {
                if (action.scrollDimensionAsWell) {
                    this._horizontalScrollDimension.invalidate();
                    this._verticalScrollDimension.invalidate();
                }
                this._columnsValid = false;
                this._rowsValid = false;
                break;
            }
            default:
                throw new UnreachableCaseError('VLI42220', action.dimension);
        }

        this.invalidatedEventer(action);
    }

    invalidateAll(scrollDimensionAsWell: boolean) {
        const action: ViewLayout.AllInvalidateAction = {
            type: ViewLayout.InvalidateAction.Type.All,
            dimension: undefined,
            scrollDimensionAsWell,
        }
        this.invalidate(action);
    }

    invalidateHorizontalAll(scrollablePlaneDimensionAsWell: boolean) {
        const action: ViewLayout.AllInvalidateAction = {
            type: ViewLayout.InvalidateAction.Type.All,
            dimension: HorizontalVertical.Horizontal,
            scrollDimensionAsWell: scrollablePlaneDimensionAsWell,
        }
        this.invalidate(action);
    }

    invalidateVerticalAll(scrollablePlaneDimensionAsWell: boolean) {
        const action: ViewLayout.AllInvalidateAction = {
            type: ViewLayout.InvalidateAction.Type.All,
            dimension: HorizontalVertical.Vertical,
            scrollDimensionAsWell: scrollablePlaneDimensionAsWell,
        }
        this.invalidate(action);
    }

    invalidateColumnsInserted(index: number, count: number) {
        const action: ViewLayout.DataRangeInsertedInvalidateAction = {
            type: ViewLayout.InvalidateAction.Type.DataRangeInserted,
            dimension: HorizontalVertical.Horizontal,
            scrollDimensionAsWell: true,
            index,
            count,
        };
        this.invalidate(action);
    }

    invalidateActiveColumnsDeleted(index: number, count: number) {
        const viewLayoutColumns = this.columns;
        const viewLayoutColumnCount = viewLayoutColumns.length;
        if (viewLayoutColumnCount === 0) {
            throw new AssertError('VLIACD33321');
        } else {
            const lastViewLayoutColumn = viewLayoutColumns[viewLayoutColumnCount - 1];
            if (index <= lastViewLayoutColumn.activeColumnIndex) {
                const action: ViewLayout.ActiveRangeDeletedInvalidateAction = {
                    type: ViewLayout.InvalidateAction.Type.ActiveRangeDeleted,
                    dimension: HorizontalVertical.Horizontal,
                    scrollDimensionAsWell: true,
                    index,
                    count,
                };
                this.invalidate(action);
            }
        }
    }

    invalidateAllColumnsDeleted() {
        const action: ViewLayout.AllDeletedInvalidateAction = {
            type: ViewLayout.InvalidateAction.Type.AllDeleted,
            dimension: HorizontalVertical.Horizontal,
            scrollDimensionAsWell: true,
        };
        this.invalidate(action);
    }

    invalidateColumnsChanged() {
        const action: ViewLayout.AllChangedInvalidateAction = {
            type: ViewLayout.InvalidateAction.Type.AllChanged,
            dimension: HorizontalVertical.Horizontal,
            scrollDimensionAsWell: true,
        };
        this.invalidate(action);
    }

    invalidateDataRowsInserted(index: number, count: number) {
        const lastScrollableSubgridRowIndex = this.lastScrollableSubgridRowIndex;
        if (lastScrollableSubgridRowIndex === undefined || index <= lastScrollableSubgridRowIndex) {
            const action: ViewLayout.DataRangeInsertedInvalidateAction = {
                type: ViewLayout.InvalidateAction.Type.DataRangeInserted,
                dimension: HorizontalVertical.Vertical,
                scrollDimensionAsWell: true,
                index,
                count,
            };
            this.invalidate(action);
        }
    }

    invalidateDataRowsDeleted(index: number, count: number) {
        const lastScrollableSubgridRowIndex = this.lastScrollableSubgridRowIndex;
        if (lastScrollableSubgridRowIndex === undefined) {
            throw new AssertError('VLIDRD33321');
        } else {
            if (index <= lastScrollableSubgridRowIndex) {
                const action: ViewLayout.DataRangeDeletedInvalidateAction = {
                    type: ViewLayout.InvalidateAction.Type.DataRangeDeleted,
                    dimension: HorizontalVertical.Vertical,
                    scrollDimensionAsWell: true,
                    index,
                    count,
                };
                this.invalidate(action);
            }
        }
    }

    invalidateAllDataRowsDeleted() {
        const action: ViewLayout.AllDeletedInvalidateAction = {
            type: ViewLayout.InvalidateAction.Type.AllDeleted,
            dimension: HorizontalVertical.Vertical,
            scrollDimensionAsWell: true,
        };
        this.invalidate(action);
    }

    invalidateDataRowsLoaded() {
        const action: ViewLayout.LoadedInvalidateAction = {
            type: ViewLayout.InvalidateAction.Type.Loaded,
            dimension: HorizontalVertical.Vertical,
            scrollDimensionAsWell: true,
        };
        this.invalidate(action);
    }

    invalidateDataRowsMoved(oldRowIndex: number, newRowIndex: number, rowCount: number) {
        const lastScrollableSubgridRowIndex = this.lastScrollableSubgridRowIndex;
        if (lastScrollableSubgridRowIndex === undefined) {
            throw new AssertError('VLIDRM33321');
        } else {
            if (oldRowIndex <= lastScrollableSubgridRowIndex || newRowIndex <= lastScrollableSubgridRowIndex) {
                const action: ViewLayout.DataRangeMovedInvalidateAction = {
                    type: ViewLayout.InvalidateAction.Type.DataRangeMoved,
                    dimension: HorizontalVertical.Vertical,
                    scrollDimensionAsWell: true,
                    oldIndex: oldRowIndex,
                    newIndex: newRowIndex,
                    count: rowCount,
                };
                this.invalidate(action);
            }
        }
    }

    ensureValidWhileWithinAnimationFrame() {
        if (!this._horizontalScrollDimension.ensureValidWhileWithinAnimationFrame()) {
            // was previously not valid
            this._columnsValid = false;
        }

        if (!this._verticalScrollDimension.ensureValidWhileWithinAnimationFrame()) {
            // was previously not valid
            this._rowsValid = false;
        }

        if (!this._columnsValid) {
            this.computeHorizontal(true);
            this._columnsValid = true;
        }

        if (this._rowsValid) {
            this.computeVertical(true);
            this._rowsValid = true;
        }
    }

    ensureColumnRowAreInView(activeColumnIndex: number, mainSubgridRowIndex: number, maximally: boolean) {
        let viewportStartChanged = this.ensureColumnIsInView(activeColumnIndex, maximally);
        if (this.ensureRowIsInView(mainSubgridRowIndex, maximally)) {
            viewportStartChanged = true;
        }
        return viewportStartChanged;
    }

    scrollColumnsRowsBy(columnCount: number, rowCount: number) {
        this.scrollColumnsBy(columnCount);
        this.scrollRowsBy(rowCount);
    }

    /**
     * @param index - Index of active column that should be anchor
     * @return true if changed
     */
    setColumnScrollAnchor(index: number, offset = 0): boolean {
        this.ensureHorizontalValid();

        ({ index, offset } = this.ensureColumnScrollAnchorWithinLimits(index, offset));

        if (this._columnScrollAnchorIndex !== index || this._columnScrollAnchorOffset !== offset) {
            this._columnScrollAnchorIndex = index;
            this._columnScrollAnchorOffset = offset;

            this.invalidateHorizontalAll(false);
            return true;
        } else {
            return false;
        }
    }

    setColumnScrollAnchorToLimit() {
        const dimension = this.horizontalScrollDimension;
        if (this._gridSettings.gridRightAligned) {
            this.setColumnScrollAnchor(dimension.finishScrollAnchorLimitIndex, dimension.finishScrollAnchorLimitOffset);
        } else {
            this.setColumnScrollAnchor(dimension.startScrollAnchorLimitIndex, dimension.startScrollAnchorLimitOffset);
        }
    }

    scrollColumnsBy(scrollColumnCount: number) {
        if (scrollColumnCount === 0) {
            return false;
        } else {
            this.ensureHorizontalValid();

            let index: number;
            index = this._columnScrollAnchorIndex + scrollColumnCount;
            if (this._columnScrollAnchorOffset > 0) {
                if (scrollColumnCount > 0) {
                    if (this._gridSettings.gridRightAligned) {
                        index--;
                    }
                } else {
                    if (!this._gridSettings.gridRightAligned) {
                        index++;
                    }
                }
            }

            return this.setColumnScrollAnchor(index, 0);
        }
    }

    scrollHorizontalViewportBy(delta: number) {
        const newViewportStart = this._horizontalScrollDimension.viewportStart + delta;
        this.setHorizontalViewportStart(newViewportStart);
    }

    setHorizontalViewportStart(value: number): boolean {
        const { index, offset } = this._horizontalScrollDimension.calculateColumnScrollAnchor(value);
        if (index === this._columnScrollAnchorIndex && offset === this._columnScrollAnchorOffset) {
            return false;
        } else {
            this._columnScrollAnchorIndex = index;
            this._columnScrollAnchorOffset = offset;
            this.invalidateHorizontalAll(false);
            return true;
        }
    }

    ensureColumnIsInView(activeColumnIndex: number, maximally: boolean) {
        const gridRightAligned = this._gridSettings.gridRightAligned
        const firstViewportScrollableActiveColumnIndex = this.firstScrollableActiveColumnIndex;
        const fixedColumnCount = this._gridSettings.fixedColumnCount;
        let anchorUpdated = false;

        // scroll only if target not in fixed columns unless grid right aligned
        if (firstViewportScrollableActiveColumnIndex !== undefined && (activeColumnIndex >= fixedColumnCount || gridRightAligned)) {
            const leftDelta =  activeColumnIndex - firstViewportScrollableActiveColumnIndex;
            const columnIsToLeft =
                leftDelta < 0 ||
                (maximally && leftDelta === 0 && !this.firstScrollableVisibleColumnMaximallyVisible);

            if (columnIsToLeft) {
                // target is to left of scrollable columns
                if (gridRightAligned) {
                    const {index, offset} = this.horizontalScrollDimension.calculateColumnScrollAnchorToScrollIntoView(
                        activeColumnIndex, gridRightAligned
                    );
                    anchorUpdated = this.setColumnScrollAnchor(index, offset);
                } else {
                    anchorUpdated = this.setColumnScrollAnchor(activeColumnIndex);
                }
            } else {
                const lastViewportScrollableActiveColumnIndex = this.lastScrollableActiveColumnIndex;
                if (lastViewportScrollableActiveColumnIndex === undefined) {
                    throw new AssertError('SBUCSATMCV13390');
                } else {
                    const rightDelta = activeColumnIndex - lastViewportScrollableActiveColumnIndex;
                    const columnIsToRight =
                        rightDelta > 0 ||
                        (maximally && rightDelta === 0 && !this.lastScrollableVisibleColumnMaximallyVisible);

                    if (columnIsToRight) {
                        // target is to right of scrollable columns
                        if (gridRightAligned) {
                            anchorUpdated = this.setColumnScrollAnchor(activeColumnIndex);
                        } else {
                            const {index, offset} = this.horizontalScrollDimension.calculateColumnScrollAnchorToScrollIntoView(
                                activeColumnIndex, gridRightAligned
                            );
                            anchorUpdated = this.setColumnScrollAnchor(index, offset);
                        }
                    }
                }
            }
        }

        return anchorUpdated;
    }

    setRowScrollAnchor(index: number, offset: number) {
        ({ index, offset } = this.ensureColumnScrollAnchorWithinLimits(index, offset));

        if (this._rowScrollAnchorIndex !== index || this._rowScrollAnchorOffset !== offset) {
            this._rowScrollAnchorIndex = index;
            this._rowScrollAnchorOffset = offset;

            this.invalidateVerticalAll(false);
            return true;
        } else {
            return false;
        }
    }

    scrollRowsBy(rowScrollCount: number) {
        const newIndex = this._rowScrollAnchorIndex + rowScrollCount;
        this.setRowScrollAnchor(newIndex, 0);
    }

    scrollVerticalViewportBy(delta: number) {
        this.scrollRowsBy(delta);
    }

    setVerticalViewportStart(viewportStart: number){
        this.setRowScrollAnchor(viewportStart, 0);
    }

    ensureRowIsInView(mainSubgridRowIndex: number, _maximally: boolean) {
        let viewportStartChanged: boolean;

        const fixedRowCount = this._gridSettings.fixedRowCount;
        // scroll only if target not in fixed rows
        if (mainSubgridRowIndex < fixedRowCount) {
            viewportStartChanged = false;
        } else {
            const firstScrollableSubgridRowIndex = this.firstScrollableSubgridRowIndex;
            // Only scroll if got scrollable columns
            if (firstScrollableSubgridRowIndex === undefined) {
                viewportStartChanged = false;
            } else {
                if (mainSubgridRowIndex < firstScrollableSubgridRowIndex) {
                    this.setRowScrollAnchor(firstScrollableSubgridRowIndex, 0);
                    viewportStartChanged = true; // Do this until fix up vertical scrolling
                } else {
                    const lastScrollableSubgridRowIndex = this.lastScrollableSubgridRowIndex;
                    if (lastScrollableSubgridRowIndex === undefined) {
                        throw new AssertError('SBSXTMV82224'); // if first then must be last
                    } else {
                        if (mainSubgridRowIndex <= lastScrollableSubgridRowIndex) {
                            viewportStartChanged = false;
                        } else {
                            const newFirstIndex = lastScrollableSubgridRowIndex - this._verticalScrollDimension.viewportSize + 1;
                            this.setRowScrollAnchor(newFirstIndex, 0);
                            viewportStartChanged = true; // Do this until fix up vertical scrolling
                        }
                    }
                }
            }
        }

        return viewportStartChanged;
    }

    calculateHorizontalScrollableLeft(): number {
        // this is now calculated in columns and kept in ScrollablePlane ViewportStart
        this.ensureHorizontalValid();

        const gridRightAligned = this._gridSettings.gridRightAligned;
        if (gridRightAligned) {
            const finish = this.calculateScrollableViewRightUsingDimensionFinish();
            return finish - this._horizontalScrollDimension.size + 1;
        } else {
            return this.calculateScrollableViewLeftUsingDimensionStart();
        }
    }

    /**
     * @returns Answer how many rows we rendered
     */
    getRowsCount() {
        return this._rows.length - 1;
    }

    /**
     * @returns Number of columns we just rendered.
     */
    getColumnsCount() {
        return this._columns.length;
    }

    /**
     * @param x - Grid column coordinate.
     * @param y - Grid row coordinate.
     * @returns Bounding rect of cell with the given coordinates.
     */
    getBoundsOfCell(x: number, y: number): RectangleInterface {
        const vc = this._columns[x];
        const vr = this._rows[y];

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
        const viewportColumns = this._columns;

        if (this._gridSettings.gridRightAligned) {
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
    findLeftGridLineInclusiveCellFromOffset(x: number, y: number): ViewCell | undefined {
        const columnIndex = this.findIndexOfLeftGridLineInclusiveColumnFromOffset(x);
        if (columnIndex === undefined) {
            return undefined;
        } else {
            const rows = this._rows;
            const row = rows.find((aVr) => y < aVr.bottom);
            if (row === undefined) {
                return undefined;
            } else {
                const cell = this.findCellWithViewpointIndex(columnIndex, row.index);
                if (cell === undefined) {
                    throw new AssertError('VGCFMP34440');
                } else {
                    return cell;
                }
            }
        }
    }

    findCellFromOffset(x: number, y: number): ViewCell | undefined {
        const columnIndex = this.findColumnIndexFromOffset(x);
        if (columnIndex < 0) {
            return undefined;
        } else {
            const rows = this._rows;
            const row = rows.find((aVr) => y < aVr.bottom);
            if (row === undefined) {
                return undefined;
            } else {
                const cell = this.findCellWithViewpointIndex(columnIndex, row.index);
                if (cell === undefined) {
                    throw new AssertError('VGCFMP34440');
                } else {
                    return cell;
                }
            }
        }
    }

    findScrollableCellClosestToOffset(canvasOffsetX: number, canvasOffsetY: number) {
        const columnIndex = this.findIndexOfScrollableColumnClosestToOffset(canvasOffsetX);
        if (columnIndex === undefined) {
            return undefined;
        } else {
            const rowIndex = this.findIndexOfScrollableRowClosestToOffset(canvasOffsetY);
            if (rowIndex === undefined) {
                return undefined;
            } else {
                return this.findCellWithViewpointIndex(columnIndex, rowIndex);
            }
        }
    }

    findLeftGridLineInclusiveColumnFromOffset(canvasOffsetX: number) {
        const index = this.findIndexOfLeftGridLineInclusiveColumnFromOffset(canvasOffsetX);
        if (index === undefined) {
            return undefined;
        } else {
            return this._columns[index];
        }
    }

    findIndexOfLeftGridLineInclusiveColumnFromOffset(canvasOffsetX: number) {
        const columns = this._columns;
        const columnCount = columns.length;
        if (canvasOffsetX < 0 || columnCount === 0) {
            return undefined;
        } else {
            for (let i = 0; i < columnCount; i++) {
                const column = columns[i];
                if (canvasOffsetX < column.rightPlus1) {
                    return i;
                }
            }
            return undefined;
        }
    }

    findColumnIndexFromOffset(canvasOffsetX: number) {
        const columns = this._columns;
        const columnCount = columns.length;
        if (canvasOffsetX < 0 || columnCount === 0) {
            return -1;
        } else {
            for (let i = 0; i < columnCount; i++) {
                const column = columns[i];
                if (canvasOffsetX < column.rightPlus1) {
                    if (canvasOffsetX >= column.left) {
                        return i;
                    } else {
                        return -1;
                    }
                }
            }
            return -1;
        }
    }

    findRowIndexFromOffset(canvasOffsetY: number) {
        const rows = this._rows;
        const rowCount = rows.length;
        if (canvasOffsetY < 0 || rowCount === 0) {
            return -1;
        } else {
            for (let i = 0; i < rowCount; i++) {
                const row = rows[i];
                if (canvasOffsetY < row.bottom) {
                    if (canvasOffsetY >= row.top) {
                        return i;
                    } else {
                        return -1;
                    }
                }
            }
            return -1;
        }
    }

    findIndexOfScrollableColumnClosestToOffset(canvasOffsetX: number) {
        const firstScrollableColumnViewLeft = this.scrollableCanvasLeft;
        if (firstScrollableColumnViewLeft === undefined) {
            return undefined;
        } else {
            if (canvasOffsetX < firstScrollableColumnViewLeft) {
                const firstScrollableColumnIndex = this._firstScrollableColumnIndex;
                if (firstScrollableColumnIndex === undefined) {
                    throw new AssertError('VFIOSCCTOF33390')
                } else {
                    return firstScrollableColumnIndex;
                }
            } else {
                const scrollableColumnsViewRightPlus1 = firstScrollableColumnViewLeft + this._scrollableColumnsViewWidth;
                if (canvasOffsetX >= scrollableColumnsViewRightPlus1) {
                    const lastScrollableColumnIndex = this._lastScrollableColumnIndex;
                    if (lastScrollableColumnIndex === undefined) {
                        throw new AssertError('VFIOSCCTOG33390')
                    } else {
                        return lastScrollableColumnIndex;
                    }
                } else {
                    const columnIndex = this.findColumnIndexFromOffset(canvasOffsetX);
                    if (columnIndex < 0) {
                        throw new AssertError('VFIOSCCTOL33390')
                    } else {
                        return columnIndex;
                    }
                }
            }
        }
    }

    findIndexOfScrollableRowClosestToOffset(y: number) {
        const firstScrollableRowViewTop = this.firstScrollableRowViewTop;
        if (firstScrollableRowViewTop === undefined) {
            return undefined;
        } else {
            if (y < firstScrollableRowViewTop) {
                const firstScrollableRowIndex = this._firstScrollableRowIndex;
                if (firstScrollableRowIndex === undefined) {
                    throw new AssertError('VFIOSRCTFF33391');
                } else {
                    return firstScrollableRowIndex;
                }
            } else {
                const lastScrollableRowIndex = this._lastScrollableRowIndex;
                if (lastScrollableRowIndex === undefined) {
                    throw new AssertError('VFIOSRCTOF33391');
                } else {
                    const rows = this._rows;
                    const lastScrollableRow = rows[lastScrollableRowIndex];
                    if (y >= lastScrollableRow.bottom) {
                        return lastScrollableRowIndex;
                    } else {
                        const rowIndex = this.findRowIndexFromOffset(y);
                        if (rowIndex < 0) {
                            throw new AssertError('VFIOSRCTOL33391')
                        } else {
                            return rowIndex;
                        }
                    }
                }
            }
        }
    }

    createUnusedSpaceColumn(): ViewLayoutColumn | undefined {
        const columns = this._columns;
        const columnCount = columns.length;
        if (columnCount === 0) {
            return undefined;
        } else {
            if (this._gridSettings.gridRightAligned) {
                const firstColumn = columns[0];
                const firstColumnLeft = firstColumn.left;
                if (firstColumn.left <= 0) {
                    return undefined;
                } else {
                    const column: ViewLayoutColumn = {
                        index: -1,
                        activeColumnIndex: -1,
                        column: this._dummyUnusedColumn,
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
                    const column: ViewLayoutColumn = {
                        index: columnCount,
                        activeColumnIndex: columnCount,
                        column: this._dummyUnusedColumn,
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
        const rows = Array<DataModel.DataValue[]>(this._rows.length);
        for (let y = 0; y < rows.length; ++y) {
            rows[y] = Array<DataModel.DataValue>(this._columns.length);
        }

        const pool = this.getAPool();

        const cellCount = pool.length;
        for (let i = 0; i < cellCount; i++) {
            const cell = pool[i];
            const x = cell.visibleColumn.index;
            const y = cell.visibleRow.index;
            rows[y][x] = cell.value;
        }
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
    tryGetColumnWithActiveIndex(activeColumnIndex: number): ViewLayoutColumn | undefined {
        const columns = this._columns;
        const columnCount = columns.length;
        if (columnCount === 0) {
            return undefined;
        } else {
            const firstColumn = columns[0];
            const firstActiveColumnIndex = firstColumn.activeColumnIndex;
            if (activeColumnIndex < firstActiveColumnIndex) {
                return undefined
            } else {
                const columnIndex = activeColumnIndex - firstActiveColumnIndex;
                if (columnIndex >= columnCount) {
                    return undefined;
                } else {
                    return columns[columnIndex];
                }
            }
        }
    }

    tryGetFullyVisibleColumnWithActiveIndex(activeColumnIndex: number): ViewLayoutColumn | undefined {
        const columns = this._columns;
        const columnCount = columns.length;
        if (columnCount === 0) {
            return undefined;
        } else {
            const firstColumn = columns[0];
            const firstActiveColumnIndex = firstColumn.activeColumnIndex;
            if (activeColumnIndex < firstActiveColumnIndex) {
                return undefined
            } else {
                const columnIndex = activeColumnIndex - firstActiveColumnIndex;
                if (columnIndex >= columnCount) {
                    return undefined;
                } else {
                    if (columnIndex === 0) {
                        return this.firstScrollableVisibleColumnMaximallyVisible ? columns[columnIndex] : undefined;
                    } else {
                        if (columnIndex === columnCount - 1) {
                            return this.lastScrollableVisibleColumnMaximallyVisible ? columns[columnIndex] : undefined;
                        } else {
                            return columns[columnIndex];
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
        return this._columns.find((vc) => {
            return vc.column.index === columnIndex;
        });
    }

    limitActiveColumnIndexToView(activeColumnIndex: number) {
        const firstScrollableColumnIndex = this.firstScrollableColumnIndex;
        if (firstScrollableColumnIndex === undefined) {
            return undefined;
        } else {
            const columns = this._columns;
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
        return !!this._rows[rowIndex];
    }

    /**
     * @summary Get the "visible row" object matching the provided grid row index.
     * @desc Requested row may not be visible due to being outside the bounds of the rendered grid.
     * @summary Find a visible row object.
     * @param rowIndex - The grid row index.
     * @returns The given row if visible or `undefined` if not.
     */
    getVisibleRow(rowIndex: number) {
        return this._rows[rowIndex];
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
        for (const vr of this._rows) {
            if (vr.subgridRowIndex === rowIndex && vr.subgrid === subgrid) {
                return vr;
            }
        }
        return undefined;
    }

    limitRowIndexToView(rowIndex: number) {
        const firstScrollableVisibleRowIndex = this.firstScrollableRowIndex;
        if (firstScrollableVisibleRowIndex === undefined) {
            return undefined;
        } else {
            const rows = this._rows;
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

    calculateLastSelectionBounds(): ViewCell.Bounds | undefined {
        // should be moved into GridPainter
        const columnCount = this._columns.length;
        const rowCount = this._rows.length;

        if (columnCount === 0 || rowCount === 0) {
            // nothing visible
            return undefined;
        }

        const gridProps = this._gridSettings;
        const selection = this._selection;

        const selectionArea = selection.lastArea;

        if (selectionArea === undefined) {
            return undefined; // no selection
        } else {
            // todo not sure what this is for; might be defunct logic
            if (selectionArea.topLeft.x === -1) {
                // no selected area, lets exit
                return undefined;
            } else {
                const firstScrollableColumnIndex = this._firstScrollableColumnIndex;
                const firstScrollableRowIndex = this._firstScrollableRowIndex;
                if (firstScrollableColumnIndex === undefined || firstScrollableRowIndex === undefined) {
                    // selection needs scrollable data
                    return undefined;
                } else {
                    let vc: ViewLayoutColumn;
                    const vci = this._columnsByIndex;
                    let vr: ViewLayoutRow;
                    const vri = this._rowsByDataRowIndex;
                    const lastScrollableColumn = this._columns[columnCount - 1]; // last column in scrollable section
                    const lastScrollableRow = this._rows[rowCount - 1]; // last row in scrollable data section
                    const firstScrollableColumn = vci[firstScrollableColumnIndex];
                    const firstScrollableRow = vri.get(firstScrollableRowIndex);
                    const fixedColumnCount = gridProps.fixedColumnCount;
                    const fixedRowCount = gridProps.fixedRowCount;
                    const headerRowCount = this._subgridsManager.calculateHeaderRowCount();

                    if (
                        // entire selection scrolled out of view to left of visible columns; or
                        (vc = this._columns[0]) &&
                        selectionArea.exclusiveBottomRight.x < vc.activeColumnIndex ||

                        // entire selection scrolled out of view between fixed columns and scrollable columns; or
                        fixedColumnCount &&
                        (vc = this._columns[fixedColumnCount - 1]) &&
                        selectionArea.topLeft.x > vc.activeColumnIndex &&
                        selectionArea.exclusiveBottomRight.x < firstScrollableColumn.activeColumnIndex ||

                        // entire selection scrolled out of view to right of visible columns; or
                        lastScrollableColumn &&
                        selectionArea.topLeft.x > lastScrollableColumn.activeColumnIndex ||

                        // entire selection scrolled out of view above visible rows; or
                        (vr = this._rows[headerRowCount]) &&
                        selectionArea.exclusiveBottomRight.y < vr.subgridRowIndex ||

                        // entire selection scrolled out of view between fixed rows and scrollable rows; or
                        fixedRowCount &&
                        firstScrollableRow !== undefined &&
                        (vr = this._rows[headerRowCount + fixedRowCount - 1]) &&
                        selectionArea.topLeft.y > vr.subgridRowIndex &&
                        selectionArea.exclusiveBottomRight.y < firstScrollableRow.subgridRowIndex ||

                        // entire selection scrolled out of view below visible rows
                        lastScrollableRow &&
                        selectionArea.topLeft.y > lastScrollableRow.subgridRowIndex
                    ) {
                        return undefined;
                    } else {
                        const vcOrigin = vci[selectionArea.topLeft.x] || firstScrollableColumn;
                        const vrOrigin = vri.get(selectionArea.topLeft.y) || firstScrollableRow;
                        const vcCorner = vci[selectionArea.exclusiveBottomRight.x] || (selectionArea.exclusiveBottomRight.x > lastScrollableColumn.activeColumnIndex ? lastScrollableColumn : vci[fixedColumnCount - 1]);
                        const vrCorner = vri.get(selectionArea.exclusiveBottomRight.y) || (selectionArea.exclusiveBottomRight.y > lastScrollableRow.subgridRowIndex ? lastScrollableRow : vri.get(fixedRowCount - 1));

                        if (!(vcOrigin && vrOrigin && vcCorner && vrCorner)) {
                            return undefined;
                        } else {
                            const bounds: ViewCell.Bounds = {
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

    // calculatePageLeftColumnScrollAnchor(): Viewport.ScrollAnchor | undefined {
    //     if (!this._valid) {
    //         throw new AssertError('VCPLCSA49498');
    //     } else {
    //         const scrollableColumnsViewWidth = this.scrollableColumnsViewWidth;
    //         if (scrollableColumnsViewWidth === 0) {
    //             return undefined; // no change
    //         } else {
    //             //
    //         }
    //     }
    // }

    /**
     * @returns Current vertical scroll value.
     */
    getScrollTop(): number {
        return this._rowScrollAnchorIndex;
    }

    /**
     * @returns The last col was rendered (is visible)
     */
    isLastColumnVisible(): boolean {
        const lastColumnIndex = this._columnsManager.activeColumnCount - 1;
        return !!this._columns.find((vc) => { return vc.activeColumnIndex === lastColumnIndex; });
    }

    /**
     * @returns The rendered column width at index
     */
    getRenderedWidth(index: number) {
        const columns = this._columns;
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
        const rows = this._rows;
        let result: number;

        if (index >= rows.length) {
            const last = rows[rows.length - 1];
            result = last.bottom;
        } else {
            result = rows[index].top;
        }

        return result;
    }

    calculatePageLeftColumnAnchor(): ViewLayout.ScrollAnchor | undefined {
        return undefined;
    }
    calculatePageRightColumnAnchor(): ViewLayout.ScrollAnchor | undefined {
        return undefined;
    }

    /**
     * @returns The row to go to for a page up.
     */
    calculatePageUpRowAnchor(): ViewLayout.ScrollAnchor | undefined {
        const firstScrollableSubgridRowIndex = this.firstScrollableSubgridRowIndex;
        if (firstScrollableSubgridRowIndex === undefined) {
            return undefined;
        } else {
            let rowIndex = firstScrollableSubgridRowIndex - this.verticalScrollDimension.size + 1; // assumes row heights do not differ - fix in future;
            const startLimitIndex = this.verticalScrollDimension.startScrollAnchorLimitIndex;
            if (rowIndex < startLimitIndex) {
                rowIndex = startLimitIndex;
            }
            return {
                index: rowIndex,
                offset: 0,
            };
        }
    }

    /**
     * @returns The row to goto for a page down.
     */
    calculatePageDownRowAnchor(): ViewLayout.ScrollAnchor | undefined {
        const lastScrollableSubgridRowIndex = this.lastScrollableSubgridRowIndex;
        if (lastScrollableSubgridRowIndex === undefined) {
            return undefined;
        } else {
            let rowIndex = lastScrollableSubgridRowIndex;
            const finishLimitIndex = this.verticalScrollDimension.finishScrollAnchorLimitIndex;
            if (rowIndex > finishLimitIndex) {
                rowIndex = finishLimitIndex - this.verticalScrollDimension.size; // assumes row heights do not differ - fix in future
            }
            const startLimitIndex = this.verticalScrollDimension.startScrollAnchorLimitIndex;
            if (rowIndex < startLimitIndex) {
                rowIndex = startLimitIndex;
            }
            return {
                index: rowIndex,
                offset: 0,
            };
        }
    }

    /**
     * Overridable for alternative or faster logic.
     * @param CellEvent
     * @returns {object} Layered config object.
     */
    // assignProps: layerProps,

    /**
     * @param allColumnIndexOrCellEvent - This is the "data" x coordinate.
     * @param subgridRowIndex - This is the "data" y coordinate. Omit if `colIndexOrCellEvent` is a `CellEvent`.
     * @param subgrid Omit if `colIndexOrCellEvent` is a `CellEvent`.
     * @returns The matching `CellEvent` object from the renderer's pool. Returns `undefined` if the requested cell is not currently visible (due to being scrolled out of view).
     */
    findCellWithDataIndex(allColumnIndexOrCellEvent: number | ViewCell, subgridRowIndex?: number, subgrid?: SubgridInterface) {
        let allColumnIndex: number;
        const pool = this.getAPool();

        if (typeof allColumnIndexOrCellEvent === 'object') {
            // colIndexOrCellEvent is a cell event object
            subgrid = allColumnIndexOrCellEvent.subgrid;
            subgridRowIndex = allColumnIndexOrCellEvent.dataPoint.y;
            allColumnIndex = allColumnIndexOrCellEvent.dataPoint.x;
        } else {
            allColumnIndex = allColumnIndexOrCellEvent;
        }

        if (subgrid === undefined) {
            subgrid = this._mainSubgrid;
        }

        let len = this._columns.length;
        len *= this._rows.length;
        for (let p = 0; p < len; ++p) {
            const cell = pool[p];
            if (
                cell.subgrid === subgrid &&
                cell.dataPoint.x === allColumnIndex &&
                cell.dataPoint.y === subgridRowIndex
            ) {
                return cell;
            }
        }
        return undefined;
    }

    findCellWithViewpointIndex(viewportColumnIndex: number, viewportRowIndex: number) {
        if (this._columnRowOrderedCellPoolComputationId === this._rowsColumnsComputationId) {
            const cellIndex = viewportColumnIndex * this._rows.length + viewportRowIndex;
            return this._columnRowOrderedCellPool[cellIndex];
        } else {
            if (this._rowColumnOrderedCellPoolComputationId === this._rowsColumnsComputationId) {
                const cellIndex = viewportRowIndex * this._columns.length + viewportColumnIndex;
                return this._rowColumnOrderedCellPool[cellIndex];
            } else {
                if (this._columnRowOrderedCellPoolComputationId > 0) {
                    const pool = this.getColumnRowOrderedCellPool();
                    const cellIndex = viewportColumnIndex * this._rows.length + viewportRowIndex;
                    return pool[cellIndex];
                } else {
                    if (this._rowColumnOrderedCellPoolComputationId > 0) {
                        const pool = this.getRowColumnOrderedCellPool();
                        const cellIndex = viewportRowIndex * this._columns.length + viewportColumnIndex;
                        return pool[cellIndex];
                    } else {
                        const pool = this.getColumnRowOrderedCellPool();
                        const cellIndex = viewportColumnIndex * this._rows.length + viewportRowIndex;
                        return pool[cellIndex];
                    }
                }
            }
        }
    }

    /**
     * Resets the cell properties cache in the matching `CellEvent` object from the renderer's pool. This will insure that a new cell properties object will be known to the renderer. (Normally, the cache is not reset until the pool is updated by the next call to {@link ViewLayout#computeCellBounds}).
     */
    resetCellPropertiesCache(xOrCellEvent: number | ViewCell, y?: number, subgrid?: Subgrid) {
        const cell = this.findCellWithDataIndex(xOrCellEvent, y, subgrid);
        if (cell) {
            cell.clearCellOwnProperties();
        }
    }

    resetAllCellPropertiesCaches() {
        this.resetPoolAllCellPropertiesCaches(this._columnRowOrderedCellPool);
        this.resetPoolAllCellPropertiesCaches(this._rowColumnOrderedCellPool);
    }

    private handleHorizontalScrollDimensionComputedEvent(withinAnimationFrame: boolean) {
        // called within animation frame
        const overflowed = this.horizontalScrollDimension.overflowed;
        if (overflowed !== undefined) {
            if (this.horizontalScrollDimension.overflowed === false) {
                this.setColumnScrollAnchorToLimit();
            } else {
                if (!this.isColumnScrollAnchorWithinLeftLimit(this._columnScrollAnchorIndex, this._columnScrollAnchorOffset)) {
                    this._columnScrollAnchorIndex = this.horizontalScrollDimension.startScrollAnchorLimitIndex;
                    this._columnScrollAnchorOffset = this.horizontalScrollDimension.startScrollAnchorLimitOffset;
                } else {
                    if (!this.isColumnScrollAnchorWithinRightLimit(this._columnScrollAnchorIndex, this._columnScrollAnchorOffset)) {
                        this._columnScrollAnchorIndex = this.horizontalScrollDimension.finishScrollAnchorLimitIndex;
                        this._columnScrollAnchorOffset = this.horizontalScrollDimension.finishScrollAnchorLimitOffset;
                    }
                }
            }
        }
        const viewportStart = this.calculateHorizontalScrollableLeft();
        if (withinAnimationFrame) {
            setTimeout(() => this.invalidateHorizontalAll(false), 0);
        } else {
            this.invalidateHorizontalAll(false);
        }
        return viewportStart;
    }

    private handleVerticalScrollDimensionComputedEvent(withinAnimationFrame: boolean): number {
        const viewportStart = Math.min(this.rowScrollAnchorIndex, this._verticalScrollDimension.finish);
        if (withinAnimationFrame) {
            setTimeout(() => this.invalidateVerticalAll(false), 0);
        } else {
            this.invalidateVerticalAll(false);
        }
        return viewportStart;
    }

    private isColumnScrollAnchorWithinLeftLimit(index: number, offset: number) {
        const result =
            (index > this.horizontalScrollDimension.startScrollAnchorLimitIndex)
            ||
            (
                (index === this.horizontalScrollDimension.startScrollAnchorLimitIndex) &&
                (offset <= this.horizontalScrollDimension.startScrollAnchorLimitOffset)
            );
        return result;
    }

    private isColumnScrollAnchorWithinRightLimit(index: number, offset: number) {
        const result =
            (index < this.horizontalScrollDimension.finishScrollAnchorLimitIndex)
            ||
            (
                (index === this.horizontalScrollDimension.finishScrollAnchorLimitIndex) &&
                (offset <= this.horizontalScrollDimension.finishScrollAnchorLimitOffset)
            );
        return result;
    }

    private isColumnScrollAnchorWithinLimits(index: number, offset: number) {
        return this.isColumnScrollAnchorWithinLeftLimit(index, offset) && this.isColumnScrollAnchorWithinRightLimit(index, offset);
    }

    private ensureColumnScrollAnchorWithinLimits(index: number, offset: number): ViewLayout.ScrollAnchor {
        if (!this.isColumnScrollAnchorWithinLeftLimit(index, offset)) {
            index = this.horizontalScrollDimension.startScrollAnchorLimitIndex;
            offset = this.horizontalScrollDimension.startScrollAnchorLimitOffset;
        } else {
            if (!this.isColumnScrollAnchorWithinRightLimit(index, offset)) {
                index = this.horizontalScrollDimension.finishScrollAnchorLimitIndex;
                offset = this.horizontalScrollDimension.finishScrollAnchorLimitOffset;
            }
        }

        return {
            index,
            offset
        };
    }

    private isRowScrollAnchorWithinTopLimit(index: number, offset: number) {
        const result =
            (index > this.verticalScrollDimension.startScrollAnchorLimitIndex)
            ||
            (
                (index === this.verticalScrollDimension.startScrollAnchorLimitIndex) &&
                (offset <= this.verticalScrollDimension.startScrollAnchorLimitOffset)
            );
        return result;
    }

    private isRowScrollAnchorWithinBottomLimit(index: number, offset: number) {
        const result =
            (index < this.verticalScrollDimension.finishScrollAnchorLimitIndex)
            ||
            (
                (index === this.verticalScrollDimension.finishScrollAnchorLimitIndex) &&
                (offset <= this.verticalScrollDimension.finishScrollAnchorLimitOffset)
            );
        return result;
    }

    private isRowScrollAnchorWithinLimits(index: number, offset: number) {
        return this.isRowScrollAnchorWithinTopLimit(index, offset) && this.isRowScrollAnchorWithinBottomLimit(index, offset);
    }

    private ensureRowScrollAnchorWithinLimits(index: number, offset: number): ViewLayout.ScrollAnchor {
        if (!this.isRowScrollAnchorWithinTopLimit(index, offset)) {
            index = this.verticalScrollDimension.startScrollAnchorLimitIndex;
            offset = this.verticalScrollDimension.startScrollAnchorLimitOffset;
        } else {
            if (!this.isColumnScrollAnchorWithinRightLimit(index, offset)) {
                index = this.verticalScrollDimension.finishScrollAnchorLimitIndex;
                offset = this.verticalScrollDimension.finishScrollAnchorLimitOffset;
            }
        }

        return {
            index,
            offset
        };
    }

    private calculateScrollableViewLeftUsingDimensionStart() {
        const dimensionStart = this._horizontalScrollDimension.start;
        const gridLinesVWidth = this._gridSettings.gridLinesVWidth;
        const columnCount = this._columnsManager.activeColumnCount;
        const fixedColumnCount = this._columnsManager.getFixedColumnCount();
        const columnScrollAnchorIndex = this._columnScrollAnchorIndex;
        let result = dimensionStart;
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

    private calculateScrollableViewRightUsingDimensionFinish() {
        const dimensionFinish = this._horizontalScrollDimension.finish;

        const gridLinesVWidth = this._gridSettings.gridLinesVWidth;
        const columnCount = this._columnsManager.activeColumnCount;
        const fixedColumnCount = this._columnsManager.getFixedColumnCount();
        const columnScrollAnchorIndex = this._columnScrollAnchorIndex;
        let result = dimensionFinish;
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
     * This function creates several data structures:
     * * {@link ViewLayout#_columns}
     * * {@link ViewLayout#_rows}
     *
     * Original comment:
     * "this function computes the grid coordinates used for extremely fast iteration over
     * painting the grid cells. this function is very fast, for thousand rows X 100 columns
     * on a modest machine taking usually 0ms and no more that 3 ms."
     *
     * @this {ViewLayout}
     */
    private computeHorizontal(withinAnimationFrame: boolean) {
        const columnsManager = this._columnsManager;
        const columns = this._columns;
        const leftMostColIndex = 0;

        const columnScrollAnchorIndex = this._columnScrollAnchorIndex;
        const columnScrollAnchorOffset = this._columnScrollAnchorOffset;

        let insertionBoundsCursor = 0;
        let previousInsertionBoundsCursorValue = 0;

        const gridSettings = this._gridSettings;
        // const borderBox = gridProps.boxSizing === 'border-box';
        const gridRightAligned = gridSettings.gridRightAligned;
        const visibleColumnWidthAdjust = gridSettings.visibleColumnWidthAdjust;

        const gridLinesVWidth = gridSettings.gridLinesVWidth;

        const fixedColumnCount = this._columnsManager.getFixedColumnCount();
        const lastFixedColumnIndex = fixedColumnCount - 1;

        let fixedWidthV: number;
        let vc: ViewLayoutColumn;

        if (gridSettings.fixedLinesVWidth === undefined) {
            fixedWidthV = gridLinesVWidth;
        } else {
            fixedWidthV = gridSettings.fixedLinesVWidth;
        }

        columns.length = 0;
        columns.gap = undefined;

        this._columnsByIndex.length = 0;

        this._insertionBounds.length = 0;

        const gridBounds = this._canvasEx.bounds;
        const gridWidth = gridBounds.width; // horizontal pixel loop limit
        const activeColumnCount = this._columnsManager.activeColumnCount;

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
                            startX = startX - gridLinesVWidth;
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
        let scrollableViewportX = 0;
        let scrollableViewportStart: number | undefined;
        let fixedColumnsViewWidth = 0;
        let scrollableColumnsViewWidth = 0;
        let fixedNonFixedBorderWidth = 0;
        let gapLeft: number | undefined;
        for (let c = start; c < activeColumnCount; c++) {
            if (x >= gridWidth) {
                columns.length = vcIndex;
                break; // no space left
            } else {
                const activeColumnWidth = columnsManager.getActiveColumnWidth(c);
                const isNonFixedColumn = c >= fixedColumnCount;

                if (c === fixedColumnCount) {
                    isFirstNonFixedColumn = true;
                }

                if (gridRightAligned || c < fixedColumnCount || c >= columnScrollAnchorIndex) {
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
                        scrollableViewportStart = scrollableViewportX;
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

                    vc = {
                        index: vcIndex,
                        activeColumnIndex: c,
                        column: columnsManager.getActiveColumn(c),
                        left,
                        width: visibleWidth,
                        rightPlus1
                    };
                    columns[vcIndex] = vc;
                    this._columnsByIndex[c] = vc;

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
                        x = x + gridLinesVWidth;
                    }

                    vcIndex++;

                    insertionBoundsCursor += Math.round(visibleWidth / 2) + previousInsertionBoundsCursorValue;
                    this._insertionBounds.push(insertionBoundsCursor);
                    previousInsertionBoundsCursorValue = Math.round(visibleWidth / 2);
                }

                if (isNonFixedColumn && scrollableViewportStart === undefined) {
                    scrollableViewportX += (activeColumnWidth + gridLinesVWidth);
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

        this._horizontalScrollDimension.setViewportStart(scrollableViewportStart, withinAnimationFrame);
        this.updateColumnsViewWidths(fixedColumnsViewWidth, scrollableColumnsViewWidth, fixedNonFixedBorderWidth, withinAnimationFrame);

        this._rowsColumnsComputationId++;
    }

    private computeVertical(withinAnimationFrame: boolean) {
        const gridSettings = this._gridSettings;
        this._rowsByDataRowIndex.clear();

        const gridBounds = this._canvasEx.bounds;
        const gridHeight = gridBounds.height; // horizontal pixel loop limit

        const rows = this._rows;
        const subgrids = this._subgridsManager.subgrids;

        const headerPlusFixedRowCount = this._subgridsManager.calculateHeaderPlusFixedRowCount();
        // get height of total number of rows in all subgrids following the data subgrid
        const footerHeight = gridSettings.defaultRowHeight * this._subgridsManager.calculateFooterRowCount();
        const lineWidthH = gridSettings.gridLinesHWidth;
        const lineGapH = lineWidthH;
        const lastFixedRowIndex = headerPlusFixedRowCount - 1;

        rows.length = 0;
        rows.gap = undefined;

        let height: number;
        let subgridRowCount: number; // rows in subgrid
        let fixedGapH: number;
        let fixedOverlapH: number;
        let subgrid: Subgrid;
        let subgridRowIndex: number;
        let gridRowIndex: number;
        let vr: ViewLayoutRow;

        if (gridSettings.fixedLinesHWidth === undefined) {
            fixedGapH = lineWidthH;
            fixedOverlapH = 0;
        } else {
            const fixedWidthH = Math.max(gridSettings.fixedLinesHWidth, lineWidthH);
            fixedGapH = fixedWidthH; // hangover from borderBox
            fixedOverlapH = fixedGapH - fixedWidthH;
        }

        const rowScrollAnchorIndex = this._rowScrollAnchorIndex;

        let gapTop: number | undefined;
        let base = 0; // sum of rows for all subgrids so far
        let y = 0; // vertical pixel loop index and limit
        const Y = gridHeight - footerHeight; // vertical pixel loop index and limit
        const subgridCount = subgrids.length; // subgrid loop index and limit
        let isMainSubgrid = false;
        let rowIndex = 0; // row loop index
        this._firstScrollableRowIndex = undefined;
        this._lastScrollableRowIndex = undefined;
        for (let subgridIndex = 0; subgridIndex < subgridCount; subgridIndex++, base += subgridRowCount) {
            subgrid = subgrids[subgridIndex];
            subgridRowCount = subgrid.getRowCount();
            isMainSubgrid = subgrid.isMain;
            const topR = rowIndex;

            // For each row of each subgrid...
            const nextSubgridFirstRowIndex = rowIndex + subgridRowCount; // row loop limit
            for (; rowIndex < nextSubgridFirstRowIndex && y < Y; rowIndex++) {
                gridRowIndex = rowIndex;
                if (isMainSubgrid && rowIndex >= headerPlusFixedRowCount) {
                    gridRowIndex += rowScrollAnchorIndex;
                    if (gridRowIndex >= nextSubgridFirstRowIndex) {
                        break; // scrolled beyond last row
                    }

                    if (this._firstScrollableRowIndex === undefined) {
                        this._firstScrollableRowIndex = rowIndex;
                    }
                }

                subgridRowIndex = gridRowIndex - base;
                height = subgrid.getRowHeight(subgridRowIndex);

                this._rows[rowIndex] = vr = {
                    index: rowIndex,
                    subgridRowIndex: subgridRowIndex,
                    subgrid: subgrid,
                    top: y,
                    height: height,
                    bottom: y + height
                };

                if (gapTop !== undefined) {
                    this._rows.gap = {
                        top: gapTop,
                        bottom: vr.top,
                    };
                    gapTop = undefined;
                }

                if (isMainSubgrid) {
                    this._rowsByDataRowIndex.set(gridRowIndex - base, vr);
                }

                y += height;

                if (rowIndex === lastFixedRowIndex) {
                    gapTop = vr.bottom + fixedOverlapH;
                    y += fixedGapH;
                } else {
                    y += lineGapH;
                }
            }

            if (isMainSubgrid) {
                subgridRowCount = rowIndex - topR;
                if (subgridRowCount > 0) {
                    // at lease one row in main subgrid
                    this._lastScrollableRowIndex = rowIndex - 1;
                }
            }
        }

        this._rowsColumnsComputationId++;
    }

    private ensureHorizontalValid() {
        if (!this._horizontalScrollDimension.ensureValid()) {
            // was previously not valid
            this._columnsValid = false;
        }

        if (!this._columnsValid) {
            this.computeHorizontal(false);
            this._columnsValid = true;
        }
    }

    private ensureVerticalValid() {
        if (!this._verticalScrollDimension.ensureValid()) {
            // was previously not valid
            this._rowsValid = false;
        }

        if (this._rowsValid) {
            this.computeVertical(false);
            this._rowsValid = true;
        }
    }

    private updateColumnsViewWidths(fixedColumnsViewWidth: number, scrollableColumnsViewWidth: number, fixedNonFixedBorderWidth: number,
        withinAnimationFrame: boolean
    ) {
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
            // const changedColumnsViewWidths: ViewLayout.ChangedColumnsViewWidths = {
            //     fixedChanged: fixedColumnsViewWidthChanged,
            //     scrollableChanged: scrollableColumnsViewWidthChanged,
            //     visibleChanged: columnsViewWidthChanged,
            // };
            if (withinAnimationFrame) {
                setTimeout(() => this.columnsViewWidthsChangedEventer(), 0);
            } else {
                this.columnsViewWidthsChangedEventer();
            }
        }
    }

    private resizeCellPool(pool: ViewCell[], requiredSize: number) {
        const previousLength = pool.length;
        pool.length = requiredSize;

        if (requiredSize > previousLength) {
            for (let i = previousLength; i < requiredSize; i++) {
                pool[i] = new ViewCell(this._columnsManager);
            }
        }
    }

    private getAPool() {
        if (this._columnRowOrderedCellPoolComputationId === this._rowsColumnsComputationId) {
            return this._columnRowOrderedCellPool;
        } else {
            if (this._rowColumnOrderedCellPoolComputationId === this._rowsColumnsComputationId) {
                return this._rowColumnOrderedCellPool;
            } else {
                if (this._columnRowOrderedCellPoolComputationId > 0) {
                    return this.getColumnRowOrderedCellPool();
                } else {
                    if (this._rowColumnOrderedCellPoolComputationId > 0) {
                        return this.getRowColumnOrderedCellPool();
                    } else {
                        return this.getColumnRowOrderedCellPool();
                    }
                }
            }
        }

    }

    private resetPoolAllCellPropertiesCaches(pool: ViewCell[]) {
        const cellCount = pool.length;
        for (let i = 0; i < cellCount; i++) {
            const cell = pool[i];
            cell.clearCellOwnProperties();
        }
    }
}

export namespace ViewLayout {
    export type GetRowHeightEventer = (this: void, y: number, subgrid: Subgrid | undefined) => number;
    export type CheckNeedsShapeChangedEventer = (this: void) => void;
    export type InvalidatedEventer = (this: void, action: InvalidateAction) => void;
    export type ColumnsViewWidthsChangedEventer = (this: void) => void;
    export type ComputedEventer = (this: void) => void;

    // export interface ChangedColumnsViewWidths {
    //     fixedChanged: boolean,
    //     scrollableChanged: boolean,
    //     visibleChanged: boolean,
    // }

    export const enum CellPoolOrder {
        ColumnRow,
        RowColumn,
    }

    export class ViewLayoutColumnArray extends Array<ViewLayoutColumn> {
        gap: ViewLayoutColumnArray.Gap | undefined;
    }

    export namespace ViewLayoutColumnArray {
        export interface Gap {
            left: number;
            rightPlus1: number;
        }
    }

    export class ViewLayoutRowArray extends Array<ViewLayoutRow> {
        gap: ViewLayoutRowArray.Gap | undefined;
    }

    export namespace ViewLayoutRowArray {
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

    export interface InvalidateAction {
        readonly type: InvalidateAction.Type;
        readonly dimension: HorizontalVertical | undefined; // undefined means both
        readonly scrollDimensionAsWell: boolean
    }

    export namespace InvalidateAction {
        export const enum Type {
            All,
            Loaded,
            DataRangeInserted,
            DataRangeDeleted,
            ActiveRangeDeleted,
            AllDeleted,
            DataRangeMoved,
            AllChanged,
        }
    }

    export interface AllInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.Type.All,
    }

    export interface LoadedInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.Type.Loaded,
    }

    export interface DataRangeInsertedInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.Type.DataRangeInserted,
        readonly index: number;
        readonly count: number;
    }

    export interface DataRangeDeletedInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.Type.DataRangeDeleted,
        readonly index: number;
        readonly count: number;
    }

    export interface ActiveRangeDeletedInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.Type.ActiveRangeDeleted,
        readonly index: number;
        readonly count: number;
    }

    export interface AllDeletedInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.Type.AllDeleted,
    }

    export interface DataRangeMovedInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.Type.DataRangeMoved,
        readonly oldIndex: number;
        readonly newIndex: number;
        readonly count: number;
    }

    export interface AllChangedInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.Type.AllChanged,
    }
}