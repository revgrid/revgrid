import { CanvasManager } from '../../components/canvas/canvas-manager';
import { DataServer } from '../../interfaces/data/data-server';
import { LinedHoverCell } from '../../interfaces/data/hover-cell';
import { MainSubgrid } from '../../interfaces/data/main-subgrid';
import { Subgrid } from '../../interfaces/data/subgrid';
import { ViewCell } from '../../interfaces/data/view-cell';
import { ViewLayoutRow } from '../../interfaces/data/view-layout-row';
import { Column } from '../../interfaces/dataless/column';
import { ViewLayoutColumn } from '../../interfaces/dataless/view-layout-column';
import { SchemaField } from '../../interfaces/schema/schema-field';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from '../../interfaces/settings/behaviored-grid-settings';
import { InexclusiveRectangle } from '../../types-utils/inexclusive-rectangle';
import { Rectangle } from '../../types-utils/rectangle';
import { AssertError, UnreachableCaseError } from '../../types-utils/revgrid-error';
import { ColumnsManager } from '../column/columns-manager';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { HorizontalScrollDimension } from './horizontal-scroll-dimension';
import { ScrollDimension } from './scroll-dimension';
import { VerticalScrollDimension } from './vertical-scroll-dimension';
import { ViewCellImplementation } from './view-cell-implementation';


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
export class ViewLayout<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> {
    /** @internal */
    layoutInvalidatedEventer: ViewLayout.LayoutInvalidatedEventer;
    /** @internal */
    columnsViewWidthsChangedEventer: ViewLayout.ColumnsViewWidthsChangedEventer;
    /** @internal */
    cellPoolComputedEventerForFocus: ViewLayout.CellPoolComputedEventer;
    /** @internal */
    cellPoolComputedEventerForMouse: ViewLayout.CellPoolComputedEventer;

    private readonly _mainSubgrid: MainSubgrid<BCS, SF>;

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
    private readonly _columns = new ViewLayout.ViewLayoutColumnArray<BCS, SF>();

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
    private readonly _rows = new ViewLayout.ViewLayoutRowArray<BCS, SF>();

    private readonly _horizontalScrollDimension: HorizontalScrollDimension<BGS, BCS, SF>;
    private readonly _verticalScrollDimension: VerticalScrollDimension<BGS, BCS, SF>;

    private readonly _dummyUnusedColumn: Column<BCS, SF>;

    private readonly _rowColumnOrderedCellPool = new Array<ViewCellImplementation<BCS, SF>>();
    private readonly _columnRowOrderedCellPool = new Array<ViewCellImplementation<BCS, SF>>();

    private _columnsValid = false;
    private _rowsValid = false;

    private _rowsColumnsComputationId = 0;
    private _rowColumnOrderedCellPoolComputationId = -1;
    private _columnRowOrderedCellPoolComputationId = -1;

    // Specifies the index of the column anchored to the bounds edge
    // Will be first non-fixed visible column or last visible column depending on the gridRightAligned property
    // Set to -1 if there is no space scrollable columns (ie only space for fixed columns)
    private _columnScrollAnchorIndex = 0;
    // Specifies the number of pixels of the anchored column which have been scrolled off the view
    private _columnScrollAnchorOffset = 0;

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
        private readonly _gridSettings: BGS,
        private readonly _canvasManager: CanvasManager<BGS>,
        private readonly _columnsManager: ColumnsManager<BCS, SF>,
        private readonly _subgridsManager: SubgridsManager<BCS, SF>,
    ) {
        this._gridSettings.viewLayoutInvalidatedEventer = (scrollDimensionAsWell) => {
            this.resetAllCellPaintFingerprints();
            this.invalidateAll(scrollDimensionAsWell);
        }
        this._gridSettings.horizontalViewLayoutInvalidatedEventer = (scrollDimensionAsWell) => {
            this.resetAllCellPaintFingerprints();
            this.invalidateHorizontalAll(scrollDimensionAsWell);
        }
        this._gridSettings.verticalViewLayoutInvalidatedEventer = (scrollDimensionAsWell) => {
            this.resetAllCellPaintFingerprints();
            this.invalidateHorizontalAll(scrollDimensionAsWell);
        }
        this._canvasManager.resizedEventerForViewLayout = () => {
            this.resetAllCellPaintFingerprints();
            this.invalidateAll(true);
        }
        this._columnsManager.invalidateHorizontalViewLayoutEventer = (scrollDimensionAsWell) => this.invalidateHorizontalAll(scrollDimensionAsWell);
        this._horizontalScrollDimension = new HorizontalScrollDimension(this._gridSettings, this._canvasManager, this._columnsManager);
        this._horizontalScrollDimension.computedEventer = (withinAnimationFrame) => this.handleHorizontalScrollDimensionComputedEvent(withinAnimationFrame);
        this._verticalScrollDimension = new VerticalScrollDimension(this._gridSettings, this._canvasManager, this._subgridsManager);
        this._verticalScrollDimension.computedEventer = (withinAnimationFrame: boolean) => this.handleVerticalScrollDimensionComputedEvent(withinAnimationFrame);

        this._dummyUnusedColumn = this._columnsManager.createDummyColumn();
        this._mainSubgrid = this._subgridsManager.mainSubgrid;
        this.reset();
    }

    get columns() {
        this.ensureHorizontalValidOutsideAnimationFrame();
        return this._columns;
    }

    get rows() {
        this.ensureVerticalValidOutsideAnimationFrame();
        return this._rows;
    }

    get rowsColumnsComputationId() { return this._rowsColumnsComputationId; }

    get horizontalScrollDimension() {
        return this._horizontalScrollDimension;
    }

    get verticalScrollDimension() {
        return this._verticalScrollDimension;
    }

    get horizontalScrollableOverflowed() {
        this.ensureHorizontalValidOutsideAnimationFrame();
        return this._horizontalScrollDimension.overflowed;
    }

    get columnScrollAnchorIndex() {
        this.ensureHorizontalValidOutsideAnimationFrame();
        return this._columnScrollAnchorIndex;
    }
    get columnScrollAnchorOffset() {
        this.ensureHorizontalValidOutsideAnimationFrame();
        return this._columnScrollAnchorOffset;
    }

    get unanchoredColumnOverflow() {
        this.ensureHorizontalValidOutsideAnimationFrame();
        return this._unanchoredColumnOverflow;
    }

    get scrollableColumnCount() {
        this.ensureHorizontalValidOutsideAnimationFrame();
        return this._columns.length - this._gridSettings.fixedColumnCount;
    }
    get firstScrollableColumnIndex() {
        this.ensureHorizontalValidOutsideAnimationFrame();
        return this._firstScrollableColumnIndex;
    }
    get firstScrollableColumn() {
        this.ensureHorizontalValidOutsideAnimationFrame();
        const firstScrollableColumnIndex = this._firstScrollableColumnIndex;
        if (firstScrollableColumnIndex === undefined) {
            return undefined;
        } else {
            return this._columns[firstScrollableColumnIndex];
        }
    }
    get firstScrollableActiveColumnIndex() {
        this.ensureHorizontalValidOutsideAnimationFrame();
        const firstScrollableColumnIndex = this._firstScrollableColumnIndex;
        if (firstScrollableColumnIndex === undefined) {
            return undefined;
        } else {
            return this._columns[firstScrollableColumnIndex].activeColumnIndex;
        }
    }
    get firstScrollableColumnLeftOverflow(): number | undefined {
        this.ensureHorizontalValidOutsideAnimationFrame();
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
        this.ensureHorizontalValidOutsideAnimationFrame();
        const lastScrollableColumnIndex = this._lastScrollableColumnIndex;
        if (lastScrollableColumnIndex === undefined) {
            return undefined;
        } else {
            return this._columns[lastScrollableColumnIndex].activeColumnIndex;
        }
    }
    get lastScrollableColumnRightOverflow(): number | undefined {
        this.ensureHorizontalValidOutsideAnimationFrame();
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
        this.ensureHorizontalValidOutsideAnimationFrame();
        return this._fixedColumnsViewWidth;
    }
    get scrollableColumnsViewWidth() {
        this.ensureHorizontalValidOutsideAnimationFrame();
        return this._scrollableColumnsViewWidth;
    }
    get columnsViewWidth() {
        this.ensureHorizontalValidOutsideAnimationFrame();
        return this._columnsViewWidth;
    }

    get scrollableRowCount() {
        this.ensureVerticalValidOutsideAnimationFrame();
        return this._rows.length - this._gridSettings.fixedRowCount;
    }
    get rowScrollAnchorIndex() {
        this.ensureVerticalValidOutsideAnimationFrame();
        return this._rowScrollAnchorIndex;
    }
    get firstScrollableRowIndex() {
        this.ensureVerticalValidOutsideAnimationFrame();
        return this._firstScrollableRowIndex;
    }
    get firstScrollableSubgridRowIndex() {
        this.ensureVerticalValidOutsideAnimationFrame();
        const firstScrollableRowIndex = this._firstScrollableRowIndex;
        if (firstScrollableRowIndex === undefined) {
            return undefined;
        } else {
            return this._rows[firstScrollableRowIndex].subgridRowIndex;
        }
    }
    get firstScrollableRowViewTop() {
        this.ensureVerticalValidOutsideAnimationFrame();
        const firstScrollableRowIndex = this._firstScrollableRowIndex;
        if (firstScrollableRowIndex === undefined) {
            return undefined
        } else {
            return this._rows[firstScrollableRowIndex].top;
        }
    }

    get lastScrollableRowIndex() {
        this.ensureVerticalValidOutsideAnimationFrame();
        return this._lastScrollableRowIndex;
    }
    get lastScrollableSubgridRowIndex() {
        this.ensureVerticalValidOutsideAnimationFrame();
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

    get scrollableCanvasBounds(): InexclusiveRectangle | undefined {
        if (!this._horizontalScrollDimension.exists) {
            return undefined;
        } else {
            const x = this._horizontalScrollDimension.start;
            const y = this.firstScrollableRowViewTop;
            if (y === undefined) {
                return undefined;
            } else {
                const width = this._horizontalScrollDimension.viewportSize;
                const height = this._canvasManager.bounds.height - y; // this does not handle situation where rows do not fill the view
                return new InexclusiveRectangle(x, y, width, height);
            }
        }
    }

    get firstScrollableVisibleColumnMaximallyVisible() {
        this.ensureHorizontalValidOutsideAnimationFrame();
        if (this._gridSettings.gridRightAligned) {
            return this._unanchoredColumnOverflow === undefined || this._unanchoredColumnOverflow === 0;
        } else {
            return this._columnScrollAnchorOffset === 0;
        }
    }

    get lastScrollableVisibleColumnMaximallyVisible() {
        this.ensureHorizontalValidOutsideAnimationFrame();
        if (this._gridSettings.gridRightAligned) {
            return this._columnScrollAnchorOffset === 0;
        } else {
            return this._unanchoredColumnOverflow === undefined || this._unanchoredColumnOverflow === 0;
        }
    }

    get columnRowCellPoolComputationInvalid() { return this._columnRowOrderedCellPoolComputationId !== this._rowsColumnsComputationId; }
    get rowColumnCellPoolComputationInvalid() { return this._rowColumnOrderedCellPoolComputationId !== this._rowsColumnsComputationId; }

    getRowColumnOrderedCellPool(): ViewCell<BCS, SF>[] {
        const pool = this._rowColumnOrderedCellPool;
        if (this.rowColumnCellPoolComputationInvalid) {
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
            this.notifyCellPoolComputed();
        }

        return pool;
    }

    getColumnRowOrderedCellPool(): ViewCell<BCS, SF>[] {
        const pool = this._columnRowOrderedCellPool;
        if (this.columnRowCellPoolComputationInvalid) {
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
                    pool[poolIndex++].reset(column, row);
                }
            }
            this._columnRowOrderedCellPoolComputationId = this._rowsColumnsComputationId;
            this.notifyCellPoolComputed();
        }

        return pool;
    }

    reset() {
        this._columns.length = 0;
        this._rows.length = 0;
        this._columnRowOrderedCellPool.length = 0;
        this._rowColumnOrderedCellPool.length = 0;

        this._rowColumnOrderedCellPoolComputationId = -1;
        this._columnRowOrderedCellPoolComputationId = -1;

        this._columnsValid = false;
        this._rowsValid = false;

        this._horizontalScrollDimension.reset();
        this._verticalScrollDimension.reset();

        this._columnScrollAnchorIndex = this._gridSettings.fixedColumnCount;
        this._columnScrollAnchorOffset = 0;
        this._rowScrollAnchorIndex = this._gridSettings.fixedRowCount;
        this._rowScrollAnchorOffset = 0;
    }

    invalidate(action: ViewLayout.InvalidateAction) {
        // in the future, may want to do more with action
        const scrollablePlaneDimensionAsWell = action.scrollDimensionAsWell;
        switch (action.dimension) {
            case ScrollDimension.AxisEnum.horizontal: {
                if (scrollablePlaneDimensionAsWell) {
                    this._horizontalScrollDimension.invalidate();
                }
                this._columnsValid = false;
                break;
            }
            case ScrollDimension.AxisEnum.vertical: {
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

        this.layoutInvalidatedEventer(action);
    }

    invalidateAll(scrollDimensionAsWell: boolean) {
        const action: ViewLayout.AllInvalidateAction = {
            type: ViewLayout.InvalidateAction.Type.All,
            dimension: undefined,
            scrollDimensionAsWell,
        }
        this.invalidate(action);
    }

    invalidateHorizontalAll(scrollDimensionAsWell: boolean) {
        const action: ViewLayout.AllInvalidateAction = {
            type: ViewLayout.InvalidateAction.Type.All,
            dimension: ScrollDimension.AxisEnum.horizontal,
            scrollDimensionAsWell: scrollDimensionAsWell,
        }
        this.invalidate(action);
    }

    invalidateVerticalAll(scrollDimensionAsWell: boolean) {
        const action: ViewLayout.AllInvalidateAction = {
            type: ViewLayout.InvalidateAction.Type.All,
            dimension: ScrollDimension.AxisEnum.vertical,
            scrollDimensionAsWell: scrollDimensionAsWell,
        }
        this.invalidate(action);
    }

    invalidateColumnsInserted(index: number, count: number) {
        const action: ViewLayout.DataRangeInsertedInvalidateAction = {
            type: ViewLayout.InvalidateAction.Type.DataRangeInserted,
            dimension: ScrollDimension.AxisEnum.horizontal,
            scrollDimensionAsWell: true,
            index,
            count,
        };
        this.invalidate(action);
    }

    invalidateActiveColumnsDeleted(index: number, count: number) {
        let affected = this.verticalScrollDimension.overflowed === false;
        if (!affected) {
            const viewLayoutColumns = this.columns;
            const viewLayoutColumnCount = viewLayoutColumns.length;
            if (viewLayoutColumnCount === 0) {
                throw new AssertError('VLIACD33321');
            } else {
                const lastViewLayoutColumn = viewLayoutColumns[viewLayoutColumnCount - 1];
                affected = index <= lastViewLayoutColumn.activeColumnIndex;
            }
        }

        let action: ViewLayout.ActiveRangeDeletedInvalidateAction;
        if (affected) {
            action = {
                type: ViewLayout.InvalidateAction.Type.ActiveRangeDeleted,
                dimension: ScrollDimension.AxisEnum.horizontal,
                scrollDimensionAsWell: true,
                index,
                count,
            };
        } else {
            action = {
                type: ViewLayout.InvalidateAction.Type.ActiveRangeDeletedButViewNotAffected,
                dimension: ScrollDimension.AxisEnum.horizontal,
                scrollDimensionAsWell: true,
                index,
                count,
            };
        }
        this.invalidate(action);
    }

    invalidateAllColumnsDeleted() {
        const action: ViewLayout.AllDeletedInvalidateAction = {
            type: ViewLayout.InvalidateAction.Type.AllDeleted,
            dimension: ScrollDimension.AxisEnum.horizontal,
            scrollDimensionAsWell: true,
        };
        this.invalidate(action);
    }

    invalidateColumnsChanged() {
        const action: ViewLayout.AllChangedInvalidateAction = {
            type: ViewLayout.InvalidateAction.Type.AllChanged,
            dimension: ScrollDimension.AxisEnum.horizontal,
            scrollDimensionAsWell: true,
        };
        this.invalidate(action);
    }

    invalidateDataRowsInserted(index: number, count: number) {
        let lastScrollableSubgridRowIndex: number | undefined;
        const affected =
            this.verticalScrollDimension.overflowed !== true ||
            (lastScrollableSubgridRowIndex = this.lastScrollableSubgridRowIndex) === undefined ||
            index <= lastScrollableSubgridRowIndex;

        let action: ViewLayout.DataRangeInsertedInvalidateAction;
        if (affected) {
            action = {
                type: ViewLayout.InvalidateAction.Type.DataRangeInserted,
                dimension: ScrollDimension.AxisEnum.vertical,
                scrollDimensionAsWell: true,
                index,
                count,
            };
        } else {
            action = {
                type: ViewLayout.InvalidateAction.Type.DataRangeInsertedButViewNotAffected,
                dimension: ScrollDimension.AxisEnum.vertical,
                scrollDimensionAsWell: true,
                index,
                count,
            };
        }
        this.invalidate(action);
    }

    invalidateDataRowsDeleted(index: number, count: number) {
        let affected = this.verticalScrollDimension.overflowed === false;
        if (!affected) {
            const lastScrollableSubgridRowIndex = this.lastScrollableSubgridRowIndex;
            if (lastScrollableSubgridRowIndex === undefined) {
                throw new AssertError('VLIDRD33321');
            } else {
                affected = index <= lastScrollableSubgridRowIndex;
            }
        }

        let action: ViewLayout.DataRangeDeletedInvalidateAction;
        if (affected) {
            action = {
                type: ViewLayout.InvalidateAction.Type.DataRangeDeleted,
                dimension: ScrollDimension.AxisEnum.vertical,
                scrollDimensionAsWell: true,
                index,
                count,
            };
        } else {
            action = {
                type: ViewLayout.InvalidateAction.Type.DataRangeDeletedButViewNotAffected,
                dimension: ScrollDimension.AxisEnum.vertical,
                scrollDimensionAsWell: true,
                index,
                count,
            };
        }
        this.invalidate(action);
    }

    invalidateAllDataRowsDeleted() {
        const action: ViewLayout.AllDeletedInvalidateAction = {
            type: ViewLayout.InvalidateAction.Type.AllDeleted,
            dimension: ScrollDimension.AxisEnum.vertical,
            scrollDimensionAsWell: true,
        };
        this.invalidate(action);
    }

    invalidateDataRowsLoaded() {
        const action: ViewLayout.LoadedInvalidateAction = {
            type: ViewLayout.InvalidateAction.Type.Loaded,
            dimension: ScrollDimension.AxisEnum.vertical,
            scrollDimensionAsWell: true,
        };
        this.invalidate(action);
    }

    invalidateDataRowsMoved(oldRowIndex: number, newRowIndex: number, rowCount: number) {
        let affected = this.verticalScrollDimension.overflowed === false;
        if (!affected) {
            const lastScrollableSubgridRowIndex = this.lastScrollableSubgridRowIndex;
            if (lastScrollableSubgridRowIndex === undefined) {
                throw new AssertError('VLIDRM33321');
            } else {
                affected = oldRowIndex <= lastScrollableSubgridRowIndex || newRowIndex <= lastScrollableSubgridRowIndex;
            }
        }

        if (affected) {
            const action: ViewLayout.DataRangeMovedInvalidateAction = {
                type: ViewLayout.InvalidateAction.Type.DataRangeMoved,
                dimension: ScrollDimension.AxisEnum.vertical,
                scrollDimensionAsWell: true,
                oldIndex: oldRowIndex,
                newIndex: newRowIndex,
                count: rowCount,
            };
            this.invalidate(action);
        }
    }

    ensureValidInsideAnimationFrame() {
        if (!this._horizontalScrollDimension.ensureValidInsideAnimationFrame()) {
            // was previously not valid
            this._columnsValid = false;
        }

        if (!this._verticalScrollDimension.ensureValidInsideAnimationFrame()) {
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
        let scrolled = this.scrollColumnsBy(columnCount);
        if (this.scrollRowsBy(rowCount)) {
            scrolled = true;
        }
        return scrolled;
    }

    /**
     * @param index - Index of active column that should be anchor
     * @return true if changed
     */
    setColumnScrollAnchor(index: number, offset: number): boolean {
        this.ensureHorizontalValidOutsideAnimationFrame();

        const { index: limitedIndex, offset: limitedOffset } = this.horizontalScrollDimension.calculateLimitedScrollAnchor(index, offset);

        if (this._columnScrollAnchorIndex !== limitedIndex || this._columnScrollAnchorOffset !== limitedOffset) {
            this._columnScrollAnchorIndex = limitedIndex;
            this._columnScrollAnchorOffset = limitedOffset;

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
            this.ensureHorizontalValidOutsideAnimationFrame();

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
        const viewportStart = this._horizontalScrollDimension.viewportStart;
        if (viewportStart !== undefined) {
            const newViewportStart = viewportStart + delta;
            this.setHorizontalViewportStart(newViewportStart);
        }
    }

    setHorizontalViewportStart(value: number): boolean {
        const { index, offset } = this._horizontalScrollDimension.calculateLimitedScrollAnchorFromViewportStart(value);
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
        const scrollableColumnCount = this.scrollableColumnCount;
        let anchorUpdated = false;

        // scroll only if target not in fixed columns unless grid right aligned
        if (firstViewportScrollableActiveColumnIndex !== undefined && (activeColumnIndex >= fixedColumnCount || gridRightAligned)) {
            const leftDelta =  activeColumnIndex - firstViewportScrollableActiveColumnIndex;
            const columnIsToLeft =
                leftDelta < 0 ||
                (
                    maximally &&
                    leftDelta === 0 &&
                    !this.firstScrollableVisibleColumnMaximallyVisible &&
                    (scrollableColumnCount > 1 || !gridRightAligned)
                );

            if (columnIsToLeft) {
                // target is to left of scrollable columns
                if (gridRightAligned) {
                    const {index, offset} = this.horizontalScrollDimension.calculateColumnScrollAnchorToScrollIntoView(
                        activeColumnIndex, gridRightAligned
                    );
                    anchorUpdated = this.setColumnScrollAnchor(index, offset);
                } else {
                    anchorUpdated = this.setColumnScrollAnchor(activeColumnIndex, 0);
                }
            } else {
                const lastViewportScrollableActiveColumnIndex = this.lastScrollableActiveColumnIndex;
                if (lastViewportScrollableActiveColumnIndex === undefined) {
                    throw new AssertError('SBUCSATMCV13390');
                } else {
                    const rightDelta = activeColumnIndex - lastViewportScrollableActiveColumnIndex;
                    const columnIsToRight =
                        rightDelta > 0 ||
                        (
                            maximally &&
                            rightDelta === 0 &&
                            !this.lastScrollableVisibleColumnMaximallyVisible &&
                            (scrollableColumnCount > 1 || gridRightAligned)
                        );

                    if (columnIsToRight) {
                        // target is to right of scrollable columns
                        if (gridRightAligned) {
                            anchorUpdated = this.setColumnScrollAnchor(activeColumnIndex, 0);
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
        this.ensureVerticalValidOutsideAnimationFrame();

        const { index: limitedIndex, offset: limitedOffset } = this.verticalScrollDimension.calculateLimitedScrollAnchor(index, offset);

        if (this._rowScrollAnchorIndex !== limitedIndex || this._rowScrollAnchorOffset !== limitedOffset) {
            this._rowScrollAnchorIndex = limitedIndex;
            this._rowScrollAnchorOffset = limitedOffset;

            this.invalidateVerticalAll(false);
            return true;
        } else {
            return false;
        }
    }

    scrollRowsBy(rowScrollCount: number) {
        const newIndex = this._rowScrollAnchorIndex + rowScrollCount;
        return this.setRowScrollAnchor(newIndex, 0);
    }

    scrollVerticalViewportBy(delta: number) {
        return this.scrollRowsBy(delta);
    }

    setVerticalViewportStart(viewportStart: number){
        this.setRowScrollAnchor(viewportStart, 0);
    }

    ensureRowIsInView(mainSubgridRowIndex: number, maximally: boolean) {
        const fixedRowCount = this._gridSettings.fixedRowCount;
        // scroll only if target not in fixed rows
        if (mainSubgridRowIndex < fixedRowCount) {
            return false;
        } else {
            const firstScrollableSubgridRowIndex = this.firstScrollableSubgridRowIndex;
            // Only scroll if got scrollable columns
            if (firstScrollableSubgridRowIndex === undefined) {
                return false;
            } else {
                if (mainSubgridRowIndex < firstScrollableSubgridRowIndex) {
                    this.setRowScrollAnchor(mainSubgridRowIndex, 0);
                    return true;
                } else {
                    const lastScrollableSubgridRowIndex = this.lastScrollableSubgridRowIndex;
                    if (lastScrollableSubgridRowIndex === undefined) {
                        throw new AssertError('SBSXTMV82224'); // if first then must be last
                    } else {
                        if (mainSubgridRowIndex < lastScrollableSubgridRowIndex) {
                            return false;
                        } else {
                            const maximallyButLastLineIsNotMaximal = maximally && !this._verticalScrollDimension.viewportSizeExact;
                            if (mainSubgridRowIndex === lastScrollableSubgridRowIndex) {
                                if (!maximallyButLastLineIsNotMaximal) {
                                    return false;
                                } else {
                                    const newFirstIndex = mainSubgridRowIndex - this._verticalScrollDimension.viewportSize + 1;
                                    this.setRowScrollAnchor(newFirstIndex, 0);
                                    return true;
                                }
                            } else {
                                const lastPosition = maximallyButLastLineIsNotMaximal ? 2 : 1;
                                const newFirstIndex = mainSubgridRowIndex - this._verticalScrollDimension.viewportSize + lastPosition;
                                this.setRowScrollAnchor(newFirstIndex, 0);
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }

    calculateHorizontalScrollableLeft(): number {
        // this is now calculated in columns and kept in ScrollablePlane ViewportStart
        this.ensureHorizontalValidOutsideAnimationFrame();

        const gridRightAligned = this._gridSettings.gridRightAligned;
        if (gridRightAligned) {
            const finish = this.calculateScrollableViewRightUsingDimensionFinish();
            return finish - this._horizontalScrollDimension.viewportSize + 1;
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
    getBoundsOfCell(x: number, y: number): Rectangle {
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
    findLinedHoverCell(canvasXOffset: number, canvasYOffset: number): LinedHoverCell<BCS, SF> | undefined {
        this.ensureValidOutsideAnimationFrame();
        const columnIndex = this.findLeftGridLineInclusiveColumnIndexOfCanvasOffset(canvasXOffset);
        if (columnIndex < 0) {
            return undefined;
        } else {
            const rowIndex = this.findTopGridLineInclusiveRowIndexOfCanvasOffset(canvasYOffset);
            if (rowIndex < 0) {
                return undefined;
            } else {
                const viewCell = this.findCellAtViewpointIndex(columnIndex, rowIndex, true);
                if (viewCell === undefined) {
                    throw new AssertError('VGCFMP34440');
                } else {
                    const mouseOverLeftLine = canvasXOffset < viewCell.viewLayoutColumn.left;
                    const mouseOverTopLine = canvasYOffset < viewCell.viewLayoutRow.top;
                    return {
                        viewCell,
                        mouseOverLeftLine,
                        mouseOverTopLine,
                    };
                }
            }
        }
    }

    findScrollableCellClosestToCanvasOffset(canvasOffsetX: number, canvasOffsetY: number) {
        const columnIndex = this.findIndexOfScrollableColumnClosestToCanvasOffset(canvasOffsetX);
        if (columnIndex < 0) {
            return undefined;
        } else {
            const rowIndex = this.findIndexOfScrollableRowClosestToOffset(canvasOffsetY);
            if (rowIndex < 0) {
                return undefined;
            } else {
                return this.findCellAtViewpointIndex(columnIndex, rowIndex, true);
            }
        }
    }

    findLeftGridLineInclusiveColumnOfCanvasOffset(canvasOffsetX: number) {
        const index = this.findLeftGridLineInclusiveColumnIndexOfCanvasOffset(canvasOffsetX);
        if (index < 0) {
            return undefined;
        } else {
            return this._columns[index];
        }
    }

    findLeftGridLineInclusiveColumnIndexOfCanvasOffset(canvasOffsetX: number) {
        const columns = this._columns;
        const columnCount = columns.length;
        if (canvasOffsetX < 0 || columnCount === 0) {
            return -1;
        } else {
            for (let i = 0; i < columnCount; i++) {
                const column = columns[i];
                if (canvasOffsetX < column.rightPlus1) {
                    return i;
                }
            }
            return -1;
        }
    }

    findColumnIndexOfCanvasOffset(canvasOffsetX: number) {
        // called from within animation frame
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

    findIndexOfScrollableColumnClosestToCanvasOffset(canvasOffsetX: number) {
        const firstScrollableColumnViewLeft = this.scrollableCanvasLeft;
        if (firstScrollableColumnViewLeft === undefined) {
            return -1;
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
                    const columnIndex = this.findLeftGridLineInclusiveColumnIndexOfCanvasOffset(canvasOffsetX);
                    if (columnIndex < 0) {
                        throw new AssertError('VFIOSCCTOL33390')
                    } else {
                        return columnIndex;
                    }
                }
            }
        }
    }

    findTopGridLineInclusiveRowOfCanvasOffset(canvasOffsetY: number) {
        const index = this.findTopGridLineInclusiveRowIndexOfCanvasOffset(canvasOffsetY);
        if (index < 0) {
            return undefined;
        } else {
            return this._rows[index];
        }
    }

    findTopGridLineInclusiveRowIndexOfCanvasOffset(canvasOffsetY: number) {
        const rows = this._rows;
        const rowCount = rows.length;
        if (canvasOffsetY < 0 || rowCount === 0) {
            return -1;
        } else {
            for (let i = 0; i < rowCount; i++) {
                const row = rows[i];
                if (canvasOffsetY < row.bottomPlus1) {
                    return i;
                }
            }
            return -1;
        }
    }

    findRowIndexOfCanvasOffset(canvasOffsetY: number) {
        const rows = this._rows;
        const rowCount = rows.length;
        if (canvasOffsetY < 0 || rowCount === 0) {
            return -1;
        } else {
            for (let i = 0; i < rowCount; i++) {
                const row = rows[i];
                if (canvasOffsetY < row.bottomPlus1) {
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

    findIndexOfScrollableRowClosestToOffset(y: number) {
        const firstScrollableRowViewTop = this.firstScrollableRowViewTop;
        if (firstScrollableRowViewTop === undefined) {
            return -1;
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
                    if (y >= lastScrollableRow.bottomPlus1) {
                        return lastScrollableRowIndex;
                    } else {
                        const rowIndex = this.findTopGridLineInclusiveRowIndexOfCanvasOffset(y);
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

    createUnusedSpaceColumn(): ViewLayoutColumn<BCS, SF> | undefined {
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
                    const column: ViewLayoutColumn<BCS, SF> = {
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
                const gridRightPlus1 = this._canvasManager.bounds.width;
                if (lastColumnRightPlus1 >= gridRightPlus1) {
                    return undefined;
                } else {
                    const column: ViewLayoutColumn<BCS, SF> = {
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
    getVisibleCellMatrix(): unknown[][] {
        const rows = Array<DataServer.ViewValue[]>(this._rows.length);
        for (let y = 0; y < rows.length; ++y) {
            rows[y] = Array<DataServer.ViewValue>(this._columns.length);
        }

        const pool = this.getAPool();

        const cellCount = pool.length;
        for (let i = 0; i < cellCount; i++) {
            const cell = pool[i];
            const x = cell.viewLayoutColumn.index;
            const y = cell.viewLayoutRow.index;
            rows[y][x] = cell.viewValue;
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
        return this.findColumnWithActiveIndex(activeIndex) !== undefined;
    }

    isActiveColumnFullyVisible(activeIndex: number) {
        return this.findFullyVisibleColumnWithActiveIndex(activeIndex) !== undefined;
    }

    /**
     * @summary Get the "visible column" object matching the provided grid column index.
     * @desc Requested column may not be visible due to being scrolled out of view.
     * @summary Find a visible column object.
     * @param activeColumnIndex - The grid column index.
     * @returns The given column if visible or `undefined` if not.
     */
    findColumnWithActiveIndex(activeColumnIndex: number): ViewLayoutColumn<BCS, SF> | undefined {
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

    findColumnWithFieldIndex(fieldIndex: number): ViewLayoutColumn<BCS, SF> | undefined {
        const columns = this._columns;
        const columnCount = columns.length;
        for (let i = 0; i < columnCount; i++) {
            const column = columns[i];
            if (column.column.field.index === fieldIndex) {
                return column;
            }
        }
        return undefined;
    }

    findRowWithSubgridRowIndex(subgridRowIndex: number, subgrid: Subgrid<BCS, SF>) {
        const rows = this._rows;
        const rowCount = rows.length;
        for (let i = 0; i < rowCount; i++) {
            const row = rows[i];
            if (row.subgridRowIndex === subgridRowIndex && row.subgrid === subgrid) {
                return row;
            }
        }
        return undefined;
    }

    findFullyVisibleColumnWithActiveIndex(activeColumnIndex: number): ViewLayoutColumn<BCS, SF> | undefined {
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
        return this.tryGetColumnWithFieldIndex(columnIndex) !== undefined;
    }

    /**
     * @summary Get the "visible column" object matching the provided data column index.
     * @desc Requested column may not be visible due to being scrolled out of view or if the column is inactive.
     * @summary Find a visible column object.
     * @param columnIndex - The grid column index.
     */
    tryGetColumnWithFieldIndex(columnIndex: number) {
        return this._columns.find((vc) => {
            return vc.column.field.index === columnIndex;
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

    isDataRowVisible(rowIndex: number, subgrid: Subgrid<BCS, SF>): boolean {
        return this.getVisibleDataRow(rowIndex, subgrid) !== undefined;
    }

    /**
     * @summary Get the "visible row" object matching the provided data row index.
     * @desc Requested row may not be visible due to being scrolled out of view.
     * @summary Find a visible row object.
     * @param rowIndex - The data row index within the given subgrid.
     * @returns The given row if visible or `undefined` if not.
     */
    getVisibleDataRow(rowIndex: number, subgrid: Subgrid<BCS, SF>) {
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
            result = last.bottomPlus1;
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
            let rowIndex = firstScrollableSubgridRowIndex - this.verticalScrollDimension.viewportSize + 1; // assumes row heights do not differ - fix in future;
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
                rowIndex = finishLimitIndex - this.verticalScrollDimension.viewportSize; // assumes row heights do not differ - fix in future
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

    findCellAtGridPoint(activeColumnIndex: number, subgridRowIndex: number, subgrid: Subgrid<BCS, SF>, canComputePool: boolean) {
        const column = this.findColumnWithActiveIndex(activeColumnIndex);
        if (column === undefined) {
            return undefined;
        } else {
            const row = this.findRowWithSubgridRowIndex(subgridRowIndex, subgrid);
            if (row === undefined) {
                return undefined;
            } else {
                return this.findCellAtViewpointIndex(column.index, row.index, canComputePool);
            }
        }
    }

    findCellAtDataPoint(allColumnIndex: number, subgridRowIndex: number, subgrid: Subgrid<BCS, SF>) {
        const column = this.findColumnWithFieldIndex(allColumnIndex);
        if (column === undefined) {
            return undefined;
        } else {
            const row = this.findRowWithSubgridRowIndex(subgridRowIndex, subgrid);
            if (row === undefined) {
                return undefined;
            } else {
                return this.findCellAtViewpointIndex(column.index, row.index, true);
            }
        }
    }

    findCellAtViewpointIndex(viewportColumnIndex: number, viewportRowIndex: number, canComputePool: boolean): ViewCell<BCS, SF> {
        // called from within animation frame
        if (this._columnRowOrderedCellPoolComputationId === this._rowsColumnsComputationId) {
            const cellIndex = viewportColumnIndex * this._rows.length + viewportRowIndex;
            return this._columnRowOrderedCellPool[cellIndex];
        } else {
            if (this._rowColumnOrderedCellPoolComputationId === this._rowsColumnsComputationId) {
                const cellIndex = viewportRowIndex * this._columns.length + viewportColumnIndex;
                return this._rowColumnOrderedCellPool[cellIndex];
            } else {
                if (!canComputePool) {
                    // cannot recompute pool if called from pool computed event
                    throw new AssertError('VLFCAVI22290');
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
    }

    findCellAtCanvasOffset(x: number, y: number, canComputePool: boolean) {
        // called from within animation frame
        const columnIndex = this.findColumnIndexOfCanvasOffset(x);
        if (columnIndex < 0) {
            return undefined;
        } else {
            const rows = this._rows;
            const row = rows.find((aVr) => y < aVr.bottomPlus1);
            if (row === undefined) {
                return undefined;
            } else {
                const cell = this.findCellAtViewpointIndex(columnIndex, row.index, canComputePool);
                if (cell === undefined) {
                    throw new AssertError('VGCFMP34440');
                } else {
                    return cell;
                }
            }
        }
    }

    resetAllCellPaintFingerprints() {
        this.resetPoolAllCellPaintFingerprints(this._columnRowOrderedCellPool);
        this.resetPoolAllCellPaintFingerprints(this._rowColumnOrderedCellPool);
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
                if (!this.horizontalScrollDimension.isScrollAnchorWithinStartLimit(this._columnScrollAnchorIndex, this._columnScrollAnchorOffset)) {
                    this._columnScrollAnchorIndex = this.horizontalScrollDimension.startScrollAnchorLimitIndex;
                    this._columnScrollAnchorOffset = this.horizontalScrollDimension.startScrollAnchorLimitOffset;
                } else {
                    if (!this.horizontalScrollDimension.isScrollAnchorWithinFinishLimit(this._columnScrollAnchorIndex, this._columnScrollAnchorOffset)) {
                        this._columnScrollAnchorIndex = this.horizontalScrollDimension.finishScrollAnchorLimitIndex;
                        this._columnScrollAnchorOffset = this.horizontalScrollDimension.finishScrollAnchorLimitOffset;
                    }
                }
            }
        }
        if (overflowed === undefined) {
            return undefined;
        } else {
            const viewportStart = this.calculateHorizontalScrollableLeft();
            if (withinAnimationFrame) {
                setTimeout(() => this.invalidateHorizontalAll(false), 0);
            } else {
                this.invalidateHorizontalAll(false);
            }
            return viewportStart;
        }
    }

    private handleVerticalScrollDimensionComputedEvent(withinAnimationFrame: boolean): number {
        const viewportStart = Math.min(this.rowScrollAnchorIndex, this._verticalScrollDimension.finishScrollAnchorLimitIndex);
        if (withinAnimationFrame) {
            setTimeout(() => this.invalidateVerticalAll(false), 0);
        } else {
            this.invalidateVerticalAll(false);
        }
        return viewportStart;
    }

    private notifyCellPoolComputed() {
        this.cellPoolComputedEventerForFocus();
        this.cellPoolComputedEventerForMouse();
    }

    private calculateScrollableViewLeftUsingDimensionStart() {
        const dimensionStart = this._horizontalScrollDimension.start;
        const gridLinesVWidth = this._gridSettings.verticalGridLinesWidth;
        const columnCount = this._columnsManager.activeColumnCount;
        const fixedColumnCount = this._columnsManager.getFixedColumnCount();
        const columnScrollAnchorIndex = this._columnScrollAnchorIndex;
        let result = dimensionStart;
        for (let i = fixedColumnCount; i < columnCount; i++) {
            if (i === columnScrollAnchorIndex) {
                break;
            } else {
                result += (this._columnsManager.getActiveColumnRoundedWidth(i) + gridLinesVWidth);
            }
        }

        result += this._columnScrollAnchorOffset;

        return result;
    }

    private calculateScrollableViewRightUsingDimensionFinish() {
        const dimensionFinish = this._horizontalScrollDimension.finish;

        const gridLinesVWidth = this._gridSettings.verticalGridLinesWidth;
        const columnCount = this._columnsManager.activeColumnCount;
        const fixedColumnCount = this._columnsManager.getFixedColumnCount();
        const columnScrollAnchorIndex = this._columnScrollAnchorIndex;
        let result = dimensionFinish;
        for (let i = columnCount - 1; i > fixedColumnCount; i--) {
            if (i === columnScrollAnchorIndex) {
                break;
            } else {
                result -= this._columnsManager.getActiveColumnRoundedWidth(i);
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
        const columns = this._columns;
        columns.length = 0;
        columns.gap = undefined;

        this._firstScrollableColumnIndex = undefined;
        this._lastScrollableColumnIndex = undefined;
        this._unanchoredColumnOverflow = undefined;

        const columnsManager = this._columnsManager;
        const activeColumnCount = this._columnsManager.activeColumnCount;

        if (activeColumnCount > 0) {
            const gridSettings = this._gridSettings;
            const gridRightAligned = gridSettings.gridRightAligned;
            const visibleColumnWidthAdjust = gridSettings.visibleColumnWidthAdjust;
            const gridLinesVWidth = gridSettings.verticalGridLinesWidth;

            const columnScrollAnchorIndex = this._columnScrollAnchorIndex;
            const columnScrollAnchorOffset = this._columnScrollAnchorOffset;
            const fixedColumnCount = this._columnsManager.getFixedColumnCount();
            const lastFixedColumnIndex = fixedColumnCount - 1;

            if (columnScrollAnchorIndex < fixedColumnCount || columnScrollAnchorIndex >= activeColumnCount) {
                throw new AssertError('VLCH60009');
            } else {
                let fixedWidthV: number;

                if (gridSettings.verticalFixedLineWidth === undefined) {
                    fixedWidthV = gridLinesVWidth;
                } else {
                    fixedWidthV = gridSettings.verticalFixedLineWidth;
                }

                const gridBounds = this._canvasManager.bounds;
                const gridWidth = gridBounds.width; // horizontal pixel loop limit

                let viewportStart: number | undefined;
                let startX: number; // horizontal pixel loop index
                let startActiveColumnIndex: number; // first visible index
                if (!gridRightAligned) {
                    startX = 0;
                    startActiveColumnIndex = 0;
                } else {
                    // We want to right align the grid in the canvas.  The last column (after scrolling) is always visible.  Work backwards to see which
                    // column is the first visible and what its x position is.

                    startActiveColumnIndex = activeColumnCount;
                    viewportStart = this._horizontalScrollDimension.start + this._horizontalScrollDimension.size;
                    startX = gridWidth;
                    let first = true;

                    do {
                        startActiveColumnIndex--;
                        const columnWidth = columnsManager.getActiveColumnRoundedWidth(startActiveColumnIndex);
                        if (startActiveColumnIndex > columnScrollAnchorIndex) {
                            // not shown in grid so does not affect startX
                            viewportStart -= columnWidth;
                            if (!first) {
                                viewportStart -= gridLinesVWidth;
                            }
                        } else {
                            if (startActiveColumnIndex ===  columnScrollAnchorIndex) {
                                if (!first) {
                                    startX -= gridLinesVWidth;
                                    viewportStart -= gridLinesVWidth;
                                }
                                startX -= columnWidth - columnScrollAnchorOffset;
                                viewportStart -= (columnScrollAnchorOffset + this._horizontalScrollDimension.viewportSize);
                            } else {
                                // cannot be first as must have columnScrollAnchorIndex
                                if (startActiveColumnIndex === lastFixedColumnIndex) {
                                    startX -= (columnWidth + fixedWidthV);
                                } else {
                                    startX -= (columnWidth + gridLinesVWidth);
                                }
                            }
                        }

                        first = false;
                    } while (startActiveColumnIndex > 0 && startX > 0);
                }

                // Now that start has been calculated, can calculate visible column values
                columns.length = activeColumnCount - startActiveColumnIndex; // maximum length
                let x = startX;
                let nonFixedStartX = startX < 0 ? 0 : startX;
                let scrollX = nonFixedStartX;
                let visibleColumnCount = 0;
                let isFirstNonFixedColumn = startActiveColumnIndex >= fixedColumnCount;
                let fixedColumnsViewWidth = 0;
                let scrollableColumnsViewWidth = 0;
                let fixedNonFixedBorderWidth = 0;
                let gapLeft: number | undefined;
                for (let activeColumnIndex = startActiveColumnIndex; activeColumnIndex < activeColumnCount; activeColumnIndex++) {
                    if (x >= gridWidth) {
                        break; // no space left
                    } else {
                        const activeColumnWidth = columnsManager.getActiveColumnRoundedWidth(activeColumnIndex);
                        const isNonFixedColumn = activeColumnIndex >= fixedColumnCount;

                        if (activeColumnIndex === fixedColumnCount) {
                            isFirstNonFixedColumn = true;
                        }

                        if (gridRightAligned || activeColumnIndex < fixedColumnCount || activeColumnIndex >= columnScrollAnchorIndex) {
                            let left: number;
                            let activeColumnOrAnchoredWidth = activeColumnWidth;
                            if (activeColumnIndex === columnScrollAnchorIndex) {
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
                                this._firstScrollableColumnIndex = visibleColumnCount;
                                if (gridRightAligned) {
                                    // if nonFixedStartX is defined, then first non fixed column is
                                    if (left < nonFixedStartX) {
                                        const overflow = nonFixedStartX - left;
                                        this._unanchoredColumnOverflow = overflow;
                                        if (visibleColumnWidthAdjust) {
                                            visibleWidth = activeColumnWidth - overflow;
                                            left = nonFixedStartX;
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
                                            viewportStart = scrollX + offset;
                                        } else {
                                            visibleWidth = activeColumnWidth;
                                            viewportStart = scrollX;
                                        }
                                    } else {
                                        visibleWidth = activeColumnWidth;
                                        viewportStart = scrollX;
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

                            const vc: ViewLayoutColumn<BCS, SF> = {
                                index: visibleColumnCount,
                                activeColumnIndex,
                                column: columnsManager.getActiveColumn(activeColumnIndex),
                                left,
                                width: visibleWidth,
                                rightPlus1
                            };
                            columns[visibleColumnCount++] = vc;

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
                            if (activeColumnIndex === lastFixedColumnIndex) {
                                fixedColumnsViewWidth = x - startX;
                                gapLeft = x; // for next loop
                                x = x + fixedWidthV;
                                nonFixedStartX = x;
                                scrollX = x;
                            } else {
                                x = x + gridLinesVWidth;
                            }
                        }

                        if (isNonFixedColumn && viewportStart === undefined) {
                            // only required to calculate viewportStart (when grid right aligned)
                            scrollX += (activeColumnWidth + gridLinesVWidth);
                        }
                    }
                }
                columns.length = visibleColumnCount;
                if (visibleColumnCount > 0) {
                    const lastVisibleColumnIndex = visibleColumnCount - 1;
                    const lastVisibleColumn = columns[lastVisibleColumnIndex];
                    const lastVisibleColumnLeft = lastVisibleColumn.left;
                    const lastVisibleColumnOriginalAfterRight = lastVisibleColumnLeft + lastVisibleColumn.width;
                    if (lastVisibleColumnOriginalAfterRight > gridWidth) {
                        const overflow = lastVisibleColumnOriginalAfterRight - gridWidth;
                        if (visibleColumnWidthAdjust) {
                            lastVisibleColumn.width -= overflow;
                        }

                        if (!gridRightAligned) {
                            this._unanchoredColumnOverflow = overflow;
                        }

                        scrollableColumnsViewWidth = lastVisibleColumnLeft + lastVisibleColumn.width - nonFixedStartX;
                    } else {
                        if (lastVisibleColumnOriginalAfterRight === gridWidth) {
                            if (!gridRightAligned) {
                                this._unanchoredColumnOverflow = 0;
                            }
                        }
                        scrollableColumnsViewWidth = lastVisibleColumnOriginalAfterRight - nonFixedStartX;
                    }
                    if (lastVisibleColumn.activeColumnIndex >= fixedColumnCount) {
                        this._lastScrollableColumnIndex = lastVisibleColumnIndex;
                    }
                } else {
                    scrollableColumnsViewWidth = gridWidth - nonFixedStartX; // may include last grid line
                }

                this._horizontalScrollDimension.setViewportStart(viewportStart, withinAnimationFrame);
                this.updateColumnsViewWidths(fixedColumnsViewWidth, scrollableColumnsViewWidth, fixedNonFixedBorderWidth, withinAnimationFrame);
            }
        }
        this._rowsColumnsComputationId++;
    }

    private computeVertical(withinAnimationFrame: boolean) {
        const gridSettings = this._gridSettings;
        const fixedRowCount = this._gridSettings.fixedRowCount;
        const gridLinesHWidth = gridSettings.horizontalGridLinesWidth;

        const gridBounds = this._canvasManager.bounds;
        const gridHeight = gridBounds.height; // horizontal pixel loop limit

        const rows = this._rows;
        const subgrids = this._subgridsManager.subgrids;
        const subgridCount = subgrids.length; // subgrid loop index and limit

        const { allPostMainSubgridsHeight, footersHeight } = this._subgridsManager.calculatePostMainAndFooterHeights();

        rows.length = 0;
        rows.gap = undefined;

        let fixedGapH: number;
        let fixedOverlapH: number;

        if (gridSettings.horizontalFixedLineWidth === undefined) {
            fixedGapH = gridLinesHWidth;
            fixedOverlapH = 0;
        } else {
            const fixedWidthH = Math.max(gridSettings.horizontalFixedLineWidth, gridLinesHWidth);
            fixedGapH = fixedWidthH; // hangover from borderBox
            fixedOverlapH = fixedGapH - fixedWidthH;
        }


        let y = 0; // vertical pixel loop index and limit
        let rowIndex = 0; // row loop index
        let mainLastFixedRowIndex: number | undefined;
        let gapTop: number | undefined;
        let firstFooterEncountered = false;
        let viewportStart: number | undefined;
        this._firstScrollableRowIndex = undefined;
        this._lastScrollableRowIndex = undefined;
        for (let subgridIndex = 0; subgridIndex < subgridCount; subgridIndex++) {
            const subgrid = subgrids[subgridIndex];
            const subgridRowCount = subgrid.getRowCount();
            const isMainSubgrid = subgrid.isMain;
            const subgridFirstRowIndex = rowIndex;

            let afterY: number;
            let subgridRowIndex: number;
            if (isMainSubgrid) {
                afterY = gridHeight - allPostMainSubgridsHeight; // leave room for the subgrids followin main
                if (allPostMainSubgridsHeight > 0) {
                    afterY -= gridLinesHWidth; // also leave room for grid line between main subgrid and post main subgrids (if there are any)
                }
                subgridRowIndex = this._rowScrollAnchorIndex - fixedRowCount; // include row spaces for fixed rows
                mainLastFixedRowIndex = rowIndex + fixedRowCount - 1; // if fixedRowCount is 0, then will never match for gap
            } else {
                afterY = gridHeight;
                subgridRowIndex = 0;

                if (subgrid.isFooter) {
                    if (!firstFooterEncountered) {
                        const placeFooterAtBottomY = gridHeight - footersHeight;
                        if (placeFooterAtBottomY > y) {
                            y = placeFooterAtBottomY;
                        }
                        firstFooterEncountered = true;
                    }
                }
            }
            // For each row of each subgrid...
            while (subgridRowIndex < subgridRowCount && y < afterY) {
                const height = subgrid.getRowHeight(subgridRowIndex);

                const row: ViewLayoutRow<BCS, SF> = {
                    index: rowIndex,
                    subgridRowIndex,
                    subgrid,
                    top: y,
                    height,
                    bottomPlus1: y + height
                };
                this._rows[rowIndex] = row;

                if (gapTop !== undefined) {
                    this._rows.gap = {
                        top: gapTop,
                        bottom: row.top,
                    };
                    gapTop = undefined;
                }

                y += height;

                if (rowIndex === mainLastFixedRowIndex) {
                    gapTop = row.bottomPlus1 + fixedOverlapH;
                    y += fixedGapH;
                } else {
                    y += gridLinesHWidth;
                }

                subgridRowIndex++;
                rowIndex++;
            }

            if (isMainSubgrid) {
                mainLastFixedRowIndex = undefined;

                if (rowIndex > subgridFirstRowIndex) {
                    // at least one row in main subgrid
                    const maxAfterFixedRowIndex = subgridFirstRowIndex + fixedRowCount; // maximum possible value of RowIndex after fixed rows
                    let afterFixedRowIndex: number; // actual RowIndex of row after fixed rows
                    if (rowIndex <= maxAfterFixedRowIndex) {
                        // only room in grid for fixed rows (if there are some, and maybe not all of them)
                        afterFixedRowIndex = rowIndex;
                    } else {
                        // all fixed rows included (if any) and at least one scrollable row in main subgrid
                        afterFixedRowIndex = maxAfterFixedRowIndex;
                        this._firstScrollableRowIndex = afterFixedRowIndex;
                        this._lastScrollableRowIndex = rowIndex - 1;
                        viewportStart = rows[afterFixedRowIndex].subgridRowIndex;
                    }

                    if (afterFixedRowIndex > subgridFirstRowIndex) {
                        // at least one fixed row
                        let fixedSugridRowIndex = 0;
                        for (let fixedRowIndex = subgridFirstRowIndex; fixedRowIndex < afterFixedRowIndex; fixedRowIndex++) {
                            rows[fixedRowIndex].subgridRowIndex = fixedSugridRowIndex++; // make fixed rows point to top rows in subgrid
                        }
                    }
                }
            }
        }

        this._verticalScrollDimension.setViewportStart(viewportStart, withinAnimationFrame);
        this._rowsColumnsComputationId++;
    }

    private ensureValidOutsideAnimationFrame() {
        if (!this._horizontalScrollDimension.ensureValidInsideAnimationFrame()) {
            // was previously not valid
            this._columnsValid = false;
        }

        if (!this._verticalScrollDimension.ensureValidInsideAnimationFrame()) {
            // was previously not valid
            this._rowsValid = false;
        }

        if (!this._columnsValid) {
            this.computeHorizontal(false);
            this._columnsValid = true;
        }

        if (this._rowsValid) {
            this.computeVertical(false);
            this._rowsValid = true;
        }
    }

    private ensureHorizontalValidOutsideAnimationFrame() {
        if (!this._horizontalScrollDimension.ensureValidOutsideAnimationFrame()) {
            // was previously not valid
            this._columnsValid = false;
        }

        if (!this._columnsValid) {
            this.computeHorizontal(false);
            this._columnsValid = true;
        }
    }

    private ensureVerticalValidOutsideAnimationFrame() {
        if (!this._verticalScrollDimension.ensureValidOutsideAnimationFrame()) {
            // was previously not valid
            this._rowsValid = false;
        }

        if (!this._rowsValid) {
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
            const columnsViewWidthChangeds: ViewLayout.ColumnsViewWidthChangeds = {
                fixedChanged: fixedColumnsViewWidthChanged,
                scrollableChanged: scrollableColumnsViewWidthChanged,
                visibleChanged: columnsViewWidthChanged,
            } as const;
            if (withinAnimationFrame) {
                setTimeout(() => this.columnsViewWidthsChangedEventer(columnsViewWidthChangeds), 0);
            } else {
                this.columnsViewWidthsChangedEventer(columnsViewWidthChangeds);
            }
        }
    }

    private resizeCellPool(pool: ViewCellImplementation<BCS, SF>[], requiredSize: number) {
        const previousLength = pool.length;
        pool.length = requiredSize;

        if (requiredSize > previousLength) {
            for (let i = previousLength; i < requiredSize; i++) {
                pool[i] = new ViewCellImplementation<BCS, SF>(this._columnsManager);
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

    private resetPoolAllCellPaintFingerprints(pool: ViewCellImplementation<BCS, SF>[]) {
        const cellCount = pool.length;
        for (let i = 0; i < cellCount; i++) {
            const cell = pool[i];
            cell.paintFingerprint = undefined;
        }
    }

    private resetPoolAllCellPropertiesCaches(pool: ViewCellImplementation<BCS, SF>[]) {
        const cellCount = pool.length;
        for (let i = 0; i < cellCount; i++) {
            const cell = pool[i];
            cell.paintFingerprint = undefined;
            cell.clearCellOwnProperties();
        }
    }
}

export namespace ViewLayout {
    export type GetRowHeightEventer<BCS extends BehavioredColumnSettings, SF extends SchemaField> = (this: void, y: number, subgrid: Subgrid<BCS, SF> | undefined) => number;
    export type CheckNeedsShapeChangedEventer = (this: void) => void;
    export type LayoutInvalidatedEventer = (this: void, action: InvalidateAction) => void;
    export type ColumnsViewWidthsChangedEventer = (this: void, changeds: ColumnsViewWidthChangeds) => void;
    export type CellPoolComputedEventer = (this: void) => void;

    export interface ColumnsViewWidthChangeds {
        readonly fixedChanged: boolean,
        readonly scrollableChanged: boolean,
        readonly visibleChanged: boolean,
    }

    export const enum CellPoolOrder {
        ColumnRow,
        RowColumn,
    }

    export class ViewLayoutColumnArray<BCS extends BehavioredColumnSettings, SF extends SchemaField> extends Array<ViewLayoutColumn<BCS, SF>> {
        gap: ViewLayoutColumnArray.Gap | undefined;
    }

    export namespace ViewLayoutColumnArray {
        export interface Gap {
            left: number;
            rightPlus1: number;
        }
    }

    export class ViewLayoutRowArray<BCS extends BehavioredColumnSettings, SF extends SchemaField> extends Array<ViewLayoutRow<BCS, SF>> {
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
        readonly dimension: ScrollDimension.AxisEnum | undefined; // undefined means both
        readonly scrollDimensionAsWell: boolean
    }

    export namespace InvalidateAction {
        export const enum Type {
            All,
            Loaded,
            DataRangeInserted,
            DataRangeInsertedButViewNotAffected,
            DataRangeDeleted,
            DataRangeDeletedButViewNotAffected,
            ActiveRangeDeleted,
            ActiveRangeDeletedButViewNotAffected,
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
        readonly type: InvalidateAction.Type.DataRangeInserted | InvalidateAction.Type.DataRangeInsertedButViewNotAffected,
        readonly index: number;
        readonly count: number;
    }

    export interface DataRangeDeletedInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.Type.DataRangeDeleted | InvalidateAction.Type.DataRangeDeletedButViewNotAffected,
        readonly index: number;
        readonly count: number;
    }

    export interface ActiveRangeDeletedInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.Type.ActiveRangeDeleted | InvalidateAction.Type.ActiveRangeDeletedButViewNotAffected,
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
