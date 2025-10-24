import { RevAssertError, RevClientObject, RevCornerRectangle, RevDataServer, RevRectangle, RevSchemaField, RevUnreachableCaseError } from '../../../common';
import { RevColumn } from '../../interfaces/column';
import { RevLinedHoverCell } from '../../interfaces/lined-hover-cell';
import { RevSubgrid } from '../../interfaces/subgrid';
import { RevViewCell } from '../../interfaces/view-cell';
import { RevViewLayoutColumn } from '../../interfaces/view-layout-column';
import { RevViewLayoutRow } from '../../interfaces/view-layout-row';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../../settings';
import { RevCanvas } from '../canvas/canvas';
import { RevColumnsManager } from '../column/columns-manager';
import { RevSubgridsManager } from '../subgrid/subgrids-manager';
import { RevHorizontalScrollDimension } from './horizontal-scroll-dimension';
import { RevScrollDimension } from './scroll-dimension';
import { RevVerticalScrollDimension } from './vertical-scroll-dimension';
import { RevViewCellImplementation } from './view-cell-implementation';


/**
 * Manages the visual layout of the grid, including the arrangement and sizing of rows and columns, scroll positions, and mapping between data and view coordinates.
 *
 * @typeParam BCS - Type of the column settings.
 * @typeParam SF - Type of the schema field.
 *
 * @see [View Layout Component 🗎](../../../../../Architecture/Client/Components/View_Layout/)
 *
 * @showGroups
 * @public
 */
export class RevViewLayout<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    /**
     * Tracks viewport size, position and scrollability in horizontal scroll dimension
     * @group Scroll Dimension
     */
    readonly horizontalScrollDimension: RevHorizontalScrollDimension<BGS, BCS, SF>;
    /**
     * Tracks viewport size, position and scrollability in vertical scroll dimension
     * @group Scroll Dimension
     */
    readonly verticalScrollDimension: RevVerticalScrollDimension<BGS, BCS, SF>;

    /** @internal */
    layoutInvalidatedEventer: RevViewLayout.LayoutInvalidatedEventer;
    /** @internal */
    columnsViewWidthsChangedEventer: RevViewLayout.ColumnsViewWidthsChangedEventer;
    /** @internal */
    cellPoolComputedEventerForFocus: RevViewLayout.CellPoolComputedEventer;
    /** @internal */
    cellPoolComputedEventerForMouse: RevViewLayout.CellPoolComputedEventer;

    /** @internal */
    private readonly _columns = new RevViewLayout.ColumnArray<BCS, SF>();

    /** @internal */
    private readonly _rows = new RevViewLayout.RowArray<BCS, SF>();

    /** @internal */
    private readonly _dummyUnusedColumn: RevColumn<BCS, SF>;

    /** @internal */
    private readonly _rowColumnOrderedCellPool = new Array<RevViewCellImplementation<BCS, SF>>();
    /** @internal */
    private readonly _columnRowOrderedCellPool = new Array<RevViewCellImplementation<BCS, SF>>();

    /** @internal */
    private _horizontalComputed = false;
    /** @internal */
    private _verticalComputed = false;

    /** @internal */
    private _preMainRowCount: number;

    /** @internal */
    private _rowsColumnsComputationId = 0;
    /** @internal */
    private _rowColumnOrderedCellPoolComputationId = -1;
    /** @internal */
    private _columnRowOrderedCellPoolComputationId = -1;

    /** @internal */
    private _columnScrollAnchorIndex = RevScrollDimension.invalidScrollAnchorIndex;
    /** @internal */
    private _columnScrollAnchorOffset = RevScrollDimension.invalidScrollAnchorOffset;

    /** @internal */
    private _unanchoredColumnOverflow: number | undefined;

    /** @internal */
    private _firstScrollableColumnIndex: number | undefined;
    /** @internal */
    private _lastScrollableColumnIndex: number | undefined;

    /** @internal */
    private _fixedColumnsViewWidth = 0;
    /** @internal */
    private _scrollableColumnsViewWidth = 0;
    /** @internal */
    private _columnsViewWidth = 0;

    /** @internal */
    private _rowScrollAnchorIndex = RevScrollDimension.invalidScrollAnchorIndex;
    /** @internal */
    private _rowScrollAnchorOffset = RevScrollDimension.invalidScrollAnchorOffset;

    /** @internal */
    private _firstScrollableRowIndex: number | undefined;
    /** @internal */
    private _lastScrollableRowIndex: number | undefined;

    /** @internal */
    constructor(
        /** @group Client Object */
        readonly clientId: string,
        /** @group Client Object */
        readonly internalParent: RevClientObject,
        /** @internal */
        private readonly _gridSettings: BGS,
        /** @internal */
        private readonly _canvas: RevCanvas<BGS>,
        /** @internal */
        private readonly _columnsManager: RevColumnsManager<BCS, SF>,
        /** @internal */
        private readonly _subgridsManager: RevSubgridsManager<BCS, SF>,
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
        this._canvas.resizedEventerForViewLayout = () => {
            this.resetAllCellPaintFingerprints();
            this.invalidateAll(true);
        }
        this._columnsManager.invalidateHorizontalViewLayoutEventer = (scrollDimensionAsWell) => { this.invalidateHorizontalAll(scrollDimensionAsWell); };
        this.horizontalScrollDimension = new RevHorizontalScrollDimension(this._gridSettings, this._canvas, this._columnsManager);
        this.horizontalScrollDimension.computedEventer = (withinAnimationFrame) => this.handleHorizontalScrollDimensionComputedEvent(withinAnimationFrame);
        this.verticalScrollDimension = new RevVerticalScrollDimension(this._gridSettings, this._canvas, this._subgridsManager);
        this.verticalScrollDimension.computedEventer = (withinAnimationFrame: boolean) => this.handleVerticalScrollDimensionComputedEvent(withinAnimationFrame);

        this._dummyUnusedColumn = this._columnsManager.createDummyColumn();
        this.reset();
    }

    /**
     * The array of columns in the view layout.
     * @group Column
     * @returns The array of columns in the view layout but restricted to readonly.
     */
    get columns(): readonly RevViewLayoutColumn<BCS, SF>[] & { gap: RevViewLayout.ColumnArray.Gap | undefined } {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        return this._columns;
    }

    /**
     * The number of columns in the view layout.
     * @group Column
     */
    get columnCount(): number {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        return this._columns.length;
    }

    /**
     * The array of rows in the view layout.
     * @group Row
     * @returns The array of rows in the view layout but restricted to readonly.
     */
    get rows(): readonly RevViewLayoutRow<BCS, SF>[] & { gap: RevViewLayout.RowArray.Gap | undefined } {
        this.ensureVerticalComputedOutsideAnimationFrame();
        return this._rows;
    }

    /**
     * The number of rows in the view layout.
     * @group Row
     */
    get rowCount(): number {
        this.ensureVerticalComputedOutsideAnimationFrame();
        return this._rows.length;
    }

    /**
     * The number of rows before/above the main subgrid in the view layout.
     * @group Row
     */
    get preMainRowCount(): number {
        this.ensureVerticalComputedOutsideAnimationFrame();
        return this._preMainRowCount;
    }


    /** @internal */
    get possiblyNotVerticallyComputedPreMainRowCount(): number {
        return this._preMainRowCount;
    }

    /**
     * A counter which increments every time the rows or columns are recomputed.
     * Used to check whether a cell pool is valid.
     * @group Pool
     * @see {@link columnRowCellPoolComputationInvalid | columnRowCellPoolComputationInvalid}
     * @see {@link rowColumnCellPoolComputationInvalid | rowColumnCellPoolComputationInvalid}
     * @see {@link getColumnRowOrderedCellPool | getColumnRowOrderedCellPool()}
     * @see {@link getRowColumnOrderedCellPool | getRowColumnOrderedCellPool()}
     */
    get rowsColumnsComputationId(): number { return this._rowsColumnsComputationId; }

    /**
     * The index of the active column which is first non-fixed column in the view (either on left or right depending on Grid alignment)
     * @returns Index of active column or -1 if there is no space for scrollable columns (ie only space for fixed columns)
     * @group Anchor
     */
    get columnScrollAnchorIndex() {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        return this._columnScrollAnchorIndex;
    }
    /**
     * Specifies the number of pixels of the anchored column which have been scrolled off the view
     * Changes to allow smooth scrolling
     * @group Anchor
     */
    get columnScrollAnchorOffset() {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        return this._columnScrollAnchorOffset;
    }

    /**
     * Specifies the number of pixels the column at the opposite end of the anchored column has off the view
     * This value will be:
     * * undefined if unanchored column does not reach the end of the view.
     * * 0 if the unanchored column is touches the edge of the view with no overflow
     * * Positive number which specifies the number of pixels the column overflows the grid on the unanchored side
     * @group Anchor
     */
    get unanchoredColumnOverflow() {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        return this._unanchoredColumnOverflow;
    }

    /**
     * Number of {@link RevViewLayoutColumn | columns} in {@link columns}
     * @group Column
     */
    get scrollableColumnCount() {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        return this._columns.length - this._gridSettings.fixedColumnCount;
    }
    /**
     * Index of the first scrollable {@link RevViewLayoutColumn | column} in {@link columns}
     * @group Column
     */
    get firstScrollableColumnIndex() {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        return this._firstScrollableColumnIndex;
    }
    /**
     * First scrollable {@link RevViewLayoutColumn | column} in view
     * @group Column
     */
    get firstScrollableColumn() {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        const firstScrollableColumnIndex = this._firstScrollableColumnIndex;
        if (firstScrollableColumnIndex === undefined) {
            return undefined;
        } else {
            return this._columns[firstScrollableColumnIndex];
        }
    }
    /**
     * @group Column
     */
    get firstScrollableActiveColumnIndex() {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        const firstScrollableColumnIndex = this._firstScrollableColumnIndex;
        if (firstScrollableColumnIndex === undefined) {
            return undefined;
        } else {
            return this._columns[firstScrollableColumnIndex].activeColumnIndex;
        }
    }
    /**
     * @group Anchor
     */
    get firstScrollableColumnLeftOverflow(): number | undefined {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        if (this._firstScrollableColumnIndex === undefined) {
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

    /**
     * @group Column
     */
    get lastScrollableColumnIndex() {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        return this._lastScrollableColumnIndex;
    }
    /**
     * @group Column
     */
    get lastScrollableColumn() {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        const lastScrollableColumnIndex = this._lastScrollableColumnIndex;
        if (lastScrollableColumnIndex === undefined) {
            return undefined;
        } else {
            return this._columns[lastScrollableColumnIndex];
        }
    }
    /**
     * @group Column
     */
    get lastScrollableActiveColumnIndex() {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        const lastScrollableColumnIndex = this._lastScrollableColumnIndex;
        if (lastScrollableColumnIndex === undefined) {
            return undefined;
        } else {
            return this._columns[lastScrollableColumnIndex].activeColumnIndex;
        }
    }
    /**
     * @group Anchor
     */
    get lastScrollableColumnRightOverflow(): number | undefined {
        this.ensureHorizontalComputedOutsideAnimationFrame();
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

    /**
     * @group Bounds
     */
    get fixedColumnsViewWidth() {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        return this._fixedColumnsViewWidth;
    }
    /**
     * @group Bounds
     */
    get scrollableColumnsViewWidth() {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        return this._scrollableColumnsViewWidth;
    }
    /**
     * @group Bounds
     */
    get columnsViewWidth() {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        return this._columnsViewWidth;
    }

    /**
     * @group Row
     */
    get scrollableRowCount() {
        this.ensureVerticalComputedOutsideAnimationFrame();
        return this._rows.length - this._gridSettings.fixedRowCount;
    }
    /**
     * @group Anchor
     */
    get rowScrollAnchorIndex() {
        this.ensureVerticalComputedOutsideAnimationFrame();
        return this._rowScrollAnchorIndex;
    }
    /**
     * Index of the first scrollable {@link RevViewLayoutRow | row} in {@link rows}
     * @group Row
     */
    get firstScrollableRowIndex() {
        this.ensureVerticalComputedOutsideAnimationFrame();
        return this._firstScrollableRowIndex;
    }
    /**
     * Subgrid row index of the first scrollable row
     * @group Row
     */
    get firstScrollableSubgridRowIndex() {
        this.ensureVerticalComputedOutsideAnimationFrame();
        const firstScrollableRowIndex = this._firstScrollableRowIndex;
        if (firstScrollableRowIndex === undefined) {
            return undefined;
        } else {
            return this._rows[firstScrollableRowIndex].subgridRowIndex;
        }
    }
    /**
     * @group Bounds
     */
    get firstScrollableRowViewTop() {
        this.ensureVerticalComputedOutsideAnimationFrame();
        const firstScrollableRowIndex = this._firstScrollableRowIndex;
        if (firstScrollableRowIndex === undefined) {
            return undefined
        } else {
            return this._rows[firstScrollableRowIndex].top;
        }
    }

    /**
     * Gets the index of the last row that can be scrolled to in the view.
     * Ensures that vertical computations are performed outside of the animation frame before returning the value.
     *
     * @returns The index of the last scrollable row, or `undefined` if not available.
     * @group Row
     */
    get lastScrollableRowIndex(): number | undefined {
        this.ensureVerticalComputedOutsideAnimationFrame();
        return this._lastScrollableRowIndex;
    }
    /**
     * Gets the subgrid row index of the last scrollable row.
     *
     * Ensures that vertical computations are up-to-date before accessing the value.
     * Returns `undefined` if there is no last scrollable row, otherwise returns the
     * corresponding subgrid row index.
     * @group Row
     */
    get lastScrollableRowSubgridRowIndex(): number | undefined {
        this.ensureVerticalComputedOutsideAnimationFrame();
        const lastScrollableRowIndex = this._lastScrollableRowIndex;
        if (lastScrollableRowIndex === undefined) {
            return undefined;
        } else {
            return this._rows[lastScrollableRowIndex].subgridRowIndex;
        }
    }

    /**
     * Gets the bounds of the canvas which contains the scrollable area.
     * @returns A `RevCornerRectangle` representing the bounds of the scrollable canvas area, or `undefined` if scrolling is not possible.
     * @group Bounds
     */
    get scrollableCanvasBounds(): RevCornerRectangle | undefined {
        if (!this.horizontalScrollDimension.scrollable) {
            return undefined;
        } else {
            const x = this.horizontalScrollDimension.start;
            const y = this.firstScrollableRowViewTop;
            if (y === undefined) {
                return undefined;
            } else {
                const width = this.horizontalScrollDimension.viewportSize;
                const height = this._canvas.flooredHeight - y; // this does not handle situation where rows do not fill the view
                return new RevCornerRectangle(x, y, width, height);
            }
        }
    }

    /**
     * Indicates whether the first (left most) scrollable column is displayed in view as much as possible.
     * @returns `true` if the first scrollable column is maximally in the view, `false` otherwise.
     * @group Column
     */
    get firstScrollableColumnIsMaximallyInView() {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        if (this._gridSettings.gridRightAligned) {
            return this._unanchoredColumnOverflow === undefined || this._unanchoredColumnOverflow === 0;
        } else {
            return this._columnScrollAnchorOffset === 0;
        }
    }

    /**
     * Indicates whether the last (right most) scrollable column is displayed in view as much as possible.
     * @returns `true` if the last scrollable column is maximally in the view, `false` otherwise.
     * @group Column
     */
    get lastScrollableColumnIsMaximallyInView() {
        this.ensureHorizontalComputedOutsideAnimationFrame();
        if (this._gridSettings.gridRightAligned) {
            return this._columnScrollAnchorOffset === 0;
        } else {
            return this._unanchoredColumnOverflow === undefined || this._unanchoredColumnOverflow === 0;
        }
    }

    /**
     * @group Pool
     */
    get columnRowCellPoolComputationInvalid() { return this._columnRowOrderedCellPoolComputationId !== this._rowsColumnsComputationId; }
    /**
     * @group Pool
     */
    get rowColumnCellPoolComputationInvalid() { return this._rowColumnOrderedCellPoolComputationId !== this._rowsColumnsComputationId; }

    /**
     * @group Pool
     */
    getRowColumnOrderedCellPool(): RevViewCell<BCS, SF>[] {
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

    /**
     * @group Pool
     */
    getColumnRowOrderedCellPool(): RevViewCell<BCS, SF>[] {
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

    /** @internal */
    reset() {
        this._columns.length = 0;
        this._rows.length = 0;
        this._columnRowOrderedCellPool.length = 0;
        this._rowColumnOrderedCellPool.length = 0;

        this._rowColumnOrderedCellPoolComputationId = -1;
        this._columnRowOrderedCellPoolComputationId = -1;

        this._horizontalComputed = false;
        this._verticalComputed = false;

        this.horizontalScrollDimension.reset();
        this.verticalScrollDimension.reset();

        this._columnScrollAnchorIndex = RevScrollDimension.invalidScrollAnchorIndex;
        this._columnScrollAnchorOffset = RevScrollDimension.invalidScrollAnchorOffset;
        this._rowScrollAnchorIndex = RevScrollDimension.invalidScrollAnchorIndex;
        this._rowScrollAnchorOffset = RevScrollDimension.invalidScrollAnchorOffset;
    }

    /** @internal */
    invalidate(action: RevViewLayout.InvalidateAction) {
        // in the future, may want to do more with action
        const scrollablePlaneDimensionAsWell = action.scrollDimensionAsWell;
        switch (action.dimension) {
            case RevScrollDimension.AxisId.horizontal: {
                if (scrollablePlaneDimensionAsWell) {
                    this.horizontalScrollDimension.invalidate();
                }
                this._horizontalComputed = false;
                break;
            }
            case RevScrollDimension.AxisId.vertical: {
                if (scrollablePlaneDimensionAsWell) {
                    this.verticalScrollDimension.invalidate();
                }
                this._verticalComputed = false;
                break;
            }
            case undefined: {
                if (action.scrollDimensionAsWell) {
                    this.horizontalScrollDimension.invalidate();
                    this.verticalScrollDimension.invalidate();
                }
                this._horizontalComputed = false;
                this._verticalComputed = false;
                break;
            }
            default:
                throw new RevUnreachableCaseError('VLI42220', action.dimension);
        }

        this.layoutInvalidatedEventer(action);
    }

    /**
     * @group Invalidate
     */
    invalidateAll(scrollDimensionAsWell: boolean) {
        const action: RevViewLayout.AllInvalidateAction = {
            type: RevViewLayout.InvalidateAction.TypeId.All,
            dimension: undefined,
            scrollDimensionAsWell,
        }
        this.invalidate(action);
    }

    /**
     * @group Invalidate
     */
    invalidateHorizontalAll(scrollDimensionAsWell: boolean) {
        const action: RevViewLayout.AllInvalidateAction = {
            type: RevViewLayout.InvalidateAction.TypeId.All,
            dimension: RevScrollDimension.AxisId.horizontal,
            scrollDimensionAsWell: scrollDimensionAsWell,
        }
        this.invalidate(action);
    }

    /**
     * @group Invalidate
     */
    invalidateVerticalAll(scrollDimensionAsWell: boolean) {
        const action: RevViewLayout.AllInvalidateAction = {
            type: RevViewLayout.InvalidateAction.TypeId.All,
            dimension: RevScrollDimension.AxisId.vertical,
            scrollDimensionAsWell: scrollDimensionAsWell,
        }
        this.invalidate(action);
    }

    /** @internal */
    invalidateHorizontalAllAndScrollDimensionWithoutAction() {
        // only used from within Animation Frame
        this.horizontalScrollDimension.invalidate();
        this._horizontalComputed = false;
    }

    /** @internal */
    invalidateFieldsInserted(index: number, count: number) {
        const action: RevViewLayout.DataRangeInsertedInvalidateAction = {
            type: RevViewLayout.InvalidateAction.TypeId.DataRangeInserted,
            dimension: RevScrollDimension.AxisId.horizontal,
            scrollDimensionAsWell: true,
            index,
            count,
        };
        this.invalidate(action);
    }

    /** @internal */
    invalidateActiveColumnsDeleted(index: number, count: number) {
        const horizontalScrollDimension = this.horizontalScrollDimension;
        if (this._canvas.flooredWidth > 0) {
            let affected = !horizontalScrollDimension.scrollable;
            if (!affected) {
                const viewLayoutColumns = this.columns;
                const viewLayoutColumnCount = viewLayoutColumns.length;
                if (viewLayoutColumnCount === 0) {
                    throw new RevAssertError('VLIACD33321');
                } else {
                    const lastViewLayoutColumn = viewLayoutColumns[viewLayoutColumnCount - 1];
                    affected = index <= lastViewLayoutColumn.activeColumnIndex; // this is not correct as scrollbar thumb size is affected
                }
            }

            let action: RevViewLayout.ActiveRangeDeletedInvalidateAction;
            if (affected) {
                action = {
                    type: RevViewLayout.InvalidateAction.TypeId.ActiveRangeDeleted,
                    dimension: RevScrollDimension.AxisId.horizontal,
                    scrollDimensionAsWell: true,
                    index,
                    count,
                };
            } else {
                action = {
                    type: RevViewLayout.InvalidateAction.TypeId.ActiveRangeDeletedButViewNotAffected,
                    dimension: RevScrollDimension.AxisId.horizontal,
                    scrollDimensionAsWell: true,
                    index,
                    count,
                };
            }
            this.invalidate(action);
        }
    }

    /** @internal */
    invalidateAllColumnsDeleted() {
        const action: RevViewLayout.AllDeletedInvalidateAction = {
            type: RevViewLayout.InvalidateAction.TypeId.AllDeleted,
            dimension: RevScrollDimension.AxisId.horizontal,
            scrollDimensionAsWell: true,
        };
        this.invalidate(action);
    }

    /** @internal */
    invalidateColumnsChanged() {
        const action: RevViewLayout.AllChangedInvalidateAction = {
            type: RevViewLayout.InvalidateAction.TypeId.AllChanged,
            dimension: RevScrollDimension.AxisId.horizontal,
            scrollDimensionAsWell: true,
        };
        this.invalidate(action);
    }

    /** @internal */
    invalidateDataRowsInserted(index: number, count: number) {
        const verticalScrollDimension = this.verticalScrollDimension;
        if (this._canvas.flooredHeight > 0) {
            let lastScrollableRowSubgridRowIndex: number | undefined;
            const affected =
                !verticalScrollDimension.scrollable || // this is not correct as scrollbar thumb is affected
                (lastScrollableRowSubgridRowIndex = this.lastScrollableRowSubgridRowIndex) === undefined ||
                index <= lastScrollableRowSubgridRowIndex;

            let action: RevViewLayout.DataRangeInsertedInvalidateAction;
            if (affected) {
                action = {
                    type: RevViewLayout.InvalidateAction.TypeId.DataRangeInserted,
                    dimension: RevScrollDimension.AxisId.vertical,
                    scrollDimensionAsWell: true,
                    index,
                    count,
                };
            } else {
                action = {
                    type: RevViewLayout.InvalidateAction.TypeId.DataRangeInsertedButViewNotAffected,
                    dimension: RevScrollDimension.AxisId.vertical,
                    scrollDimensionAsWell: true,
                    index,
                    count,
                };
            }
            this.invalidate(action);
        }
    }

    /** @internal */
    invalidateDataRowsDeleted(index: number, count: number) {
        const verticalScrollDimension = this.verticalScrollDimension;
        if (this._canvas.flooredHeight > 0) {
            let affected = !verticalScrollDimension.scrollable;
            if (!affected) {
                const lastScrollableRowSubgridRowIndex = this.lastScrollableRowSubgridRowIndex;
                if (lastScrollableRowSubgridRowIndex === undefined) {
                    throw new RevAssertError('VLIDRD33321');
                } else {
                    affected = index <= lastScrollableRowSubgridRowIndex; // this is not correct as scrollbar thumb is affected
                }
            }

            let action: RevViewLayout.DataRangeDeletedInvalidateAction;
            if (affected) {
                action = {
                    type: RevViewLayout.InvalidateAction.TypeId.DataRangeDeleted,
                    dimension: RevScrollDimension.AxisId.vertical,
                    scrollDimensionAsWell: true,
                    index,
                    count,
                };
            } else {
                action = {
                    type: RevViewLayout.InvalidateAction.TypeId.DataRangeDeletedButViewNotAffected,
                    dimension: RevScrollDimension.AxisId.vertical,
                    scrollDimensionAsWell: true,
                    index,
                    count,
                };
            }
            this.invalidate(action);
        }
    }

    /** @internal */
    invalidateAllDataRowsDeleted() {
        const action: RevViewLayout.AllDeletedInvalidateAction = {
            type: RevViewLayout.InvalidateAction.TypeId.AllDeleted,
            dimension: RevScrollDimension.AxisId.vertical,
            scrollDimensionAsWell: true,
        };
        this.invalidate(action);
    }

    /** @internal */
    invalidateDataRowsLoaded() {
        const action: RevViewLayout.LoadedInvalidateAction = {
            type: RevViewLayout.InvalidateAction.TypeId.Loaded,
            dimension: RevScrollDimension.AxisId.vertical,
            scrollDimensionAsWell: true,
        };
        this.invalidate(action);
    }

    /** @internal */
    invalidateDataRowsMoved(oldRowIndex: number, newRowIndex: number, rowCount: number) {
        const verticalScrollDimension = this.verticalScrollDimension;
        if (this._canvas.flooredHeight > 0) {
            let affected = !verticalScrollDimension.scrollable;
            if (!affected) {
                const lastScrollableRowSubgridRowIndex = this.lastScrollableRowSubgridRowIndex;
                if (lastScrollableRowSubgridRowIndex === undefined) {
                    throw new RevAssertError('VLIDRM33321');
                } else {
                    affected = oldRowIndex <= lastScrollableRowSubgridRowIndex || newRowIndex <= lastScrollableRowSubgridRowIndex; // this is not correct as scrollbar thumb is affected
                }
            }

            if (affected) {
                const action: RevViewLayout.DataRangeMovedInvalidateAction = {
                    type: RevViewLayout.InvalidateAction.TypeId.DataRangeMoved,
                    dimension: RevScrollDimension.AxisId.vertical,
                    scrollDimensionAsWell: true,
                    oldIndex: oldRowIndex,
                    newIndex: newRowIndex,
                    count: rowCount,
                };
                this.invalidate(action);
            }
        }
    }

    /** @internal */
    ensureComputedInsideAnimationFrame() {
        if (!this.horizontalScrollDimension.ensureComputedInsideAnimationFrame()) {
            // was previously not valid
            this._horizontalComputed = false;
        }

        if (!this.verticalScrollDimension.ensureComputedInsideAnimationFrame()) {
            // was previously not valid
            this._verticalComputed = false;
        }

        if (!this._horizontalComputed) {
            this.computeHorizontal(true);
            this._horizontalComputed = true;
        }

        if (this._verticalComputed) {
            this.computeVertical(true);
            this._verticalComputed = true;
        }
    }

    /**
     * Ensures that the specified cell is within the viewport.
     * If its column or row is not currently in view, adjusts the viewport to bring them into view.
     *
     * @param activeColumnIndex - The index of the active column to ensure is in view.
     * @param mainSubgridRowIndex - The index of the row in main subgrid to ensure is in view.
     * @param maximally - If true, attempts to maximize the visibility of the column and row within the viewport.
     * @returns `true` if the viewport start position was changed to bring the column or row into view; otherwise, `false`.
     * @group Scroll
     */
    ensureCellIsInView(activeColumnIndex: number, mainSubgridRowIndex: number, maximally: boolean) {
        let viewportStartChanged = this.ensureColumnIsInView(activeColumnIndex, maximally);
        if (this.ensureRowIsInView(mainSubgridRowIndex, maximally)) {
            viewportStartChanged = true;
        }
        return viewportStartChanged;
    }

    /**
     * Scrolls the viewport by the specified number of columns and rows.
     * @param columnCount - The number of columns to scroll (can be negative).
     * @param rowCount - The number of rows to scroll (can be negative).
     * @returns `true` if the viewport was scrolled; otherwise, `false`.
     * @group Scroll
     */
    scrollColumnsRowsBy(columnCount: number, rowCount: number) {
        let scrolled = this.scrollColumnsBy(columnCount);
        if (this.scrollRowsBy(rowCount)) {
            scrolled = true;
        }
        return scrolled;
    }

    /**
     * @param activeColumnIndex - Index of active column that should be anchor
     * @returns true if changed
     * @group Scroll
     */
    setColumnScrollAnchor(activeColumnIndex: number, offset: number): boolean {
        this.ensureHorizontalComputedOutsideAnimationFrame();

        if (!this.horizontalScrollDimension.scrollable) {
            return false;
        } else {
            const { index: limitedIndex, offset: limitedOffset } = this.horizontalScrollDimension.calculateLimitedScrollAnchor(activeColumnIndex, offset);

            if (this._columnScrollAnchorIndex !== limitedIndex || this._columnScrollAnchorOffset !== limitedOffset) {
                this._columnScrollAnchorIndex = limitedIndex;
                this._columnScrollAnchorOffset = limitedOffset;

                this.invalidateHorizontalAll(false);
                return true;
            } else {
                return false;
            }
        }
    }

    /**
     * Sets the column scroll anchor to its current limit.
     * This will scroll the viewport as far as possible to the right.
     * @group Scroll
     */
    setColumnScrollAnchorToLimit() {
        const dimension = this.horizontalScrollDimension;
        if (this._gridSettings.gridRightAligned) {
            this.setColumnScrollAnchor(dimension.finishScrollAnchorLimitIndex, dimension.finishScrollAnchorLimitOffset);
        } else {
            this.setColumnScrollAnchor(dimension.startScrollAnchorLimitIndex, dimension.startScrollAnchorLimitOffset);
        }
    }

    /**
     * Scrolls the viewport by the specified number of columns.
     * @param scrollColumnCount - The number of columns to scroll (can be negative).
     * @returns `true` if the viewport was scrolled; otherwise, `false`.
     * @group Scroll
     */
    scrollColumnsBy(scrollColumnCount: number) {
        if (scrollColumnCount === 0) {
            return false;
        } else {
            this.ensureHorizontalComputedOutsideAnimationFrame();

            if (!this.horizontalScrollDimension.scrollable) {
                return false;
            } else {
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
    }

    /**
     * @group Scroll
     */
    scrollHorizontalViewportBy(delta: number) {
        const viewportStart = this.horizontalScrollDimension.viewportStart;
        if (viewportStart !== undefined) {
            const newViewportStart = viewportStart + delta;
            this.setHorizontalViewportStart(newViewportStart);
        }
    }

    /**
     * @group Scroll
     */
    setHorizontalViewportStart(value: number): boolean {
        if (!this.horizontalScrollDimension.scrollable) {
            return false;
        } else {
            const { index, offset } = this.horizontalScrollDimension.calculateLimitedScrollAnchorFromViewportStart(value);
            if (index === this._columnScrollAnchorIndex && offset === this._columnScrollAnchorOffset) {
                return false;
            } else {
                this._columnScrollAnchorIndex = index;
                this._columnScrollAnchorOffset = offset;
                this.invalidateHorizontalAll(false);
                return true;
            }
        }
    }

    /**
     * @group Scroll
     */
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
                    !this.firstScrollableColumnIsMaximallyInView &&
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
                    throw new RevAssertError('SBUCSATMCV13390');
                } else {
                    const rightDelta = activeColumnIndex - lastViewportScrollableActiveColumnIndex;
                    const columnIsToRight =
                        rightDelta > 0 ||
                        (
                            maximally &&
                            rightDelta === 0 &&
                            !this.lastScrollableColumnIsMaximallyInView &&
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

    /**
     * @group Scroll
     */
    setRowScrollAnchor(index: number, offset: number) {
        this.ensureVerticalComputedOutsideAnimationFrame();

        if (!this.verticalScrollDimension.scrollable) {
            return false;
        } else {
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
    }

    /**
     * @group Scroll
     */
    setRowScrollAnchorToLimit() {
        const dimension = this.verticalScrollDimension;
        this.setRowScrollAnchor(dimension.startScrollAnchorLimitIndex, dimension.startScrollAnchorLimitOffset);
    }

    /**
     * @group Scroll
     */
    scrollRowsBy(rowScrollCount: number) {
        const newIndex = this._rowScrollAnchorIndex + rowScrollCount;
        return this.setRowScrollAnchor(newIndex, 0);
    }

    /**
     * @group Scroll
     */
    scrollVerticalViewportBy(delta: number) {
        return this.scrollRowsBy(delta);
    }

    /**
     * @group Scroll
     */
    setVerticalViewportStart(viewportStart: number){
        this.setRowScrollAnchor(viewportStart - this._preMainRowCount, 0);
    }

    /**
     * Ensures that the specified row index is within the viewport of the grid.
     * If the row is within the fixed rows, no scrolling occurs. Otherwise, the method
     * scrolls the grid to bring the row into view, considering whether the scrolling
     * should be maximal (i.e., align the row at the top of the viewport) and handling
     * edge cases where the viewport size is not an exact multiple of the row height.
     *
     * @param mainSubgridRowIndex - The index of the row in the main subgrid to ensure in viewport.
     * @param maximally - If `true`, ensure the row is maximally in view; otherwise do not scroll if it is already partially in view.
     * @returns `true` if scrolling was performed to bring the row into view; `false` otherwise.
     * @throws If the scrollable row indices are inconsistent.
     * @group Scroll
     */
    ensureRowIsInView(mainSubgridRowIndex: number, maximally: boolean): boolean {
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
                    const lastScrollableRowSubgridRowIndex = this.lastScrollableRowSubgridRowIndex;
                    if (lastScrollableRowSubgridRowIndex === undefined) {
                        throw new RevAssertError('SBSXTMV82224'); // if first then must be last
                    } else {
                        if (mainSubgridRowIndex < lastScrollableRowSubgridRowIndex) {
                            return false;
                        } else {
                            const maximallyButLastLineIsNotMaximal = maximally && !this.verticalScrollDimension.viewportSizeExactMultiple;
                            if (mainSubgridRowIndex === lastScrollableRowSubgridRowIndex) {
                                if (!maximallyButLastLineIsNotMaximal) {
                                    return false;
                                } else {
                                    const newFirstIndex = mainSubgridRowIndex - this.verticalScrollDimension.viewportSize + 1;
                                    this.setRowScrollAnchor(newFirstIndex, 0);
                                    return true;
                                }
                            } else {
                                const lastPosition = maximallyButLastLineIsNotMaximal ? 2 : 1;
                                const newFirstIndex = mainSubgridRowIndex - this.verticalScrollDimension.viewportSize + lastPosition;
                                this.setRowScrollAnchor(newFirstIndex, 0);
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * @param x - Grid column coordinate.
     * @param y - Grid row coordinate.
     * @returns Bounding rect of cell with the given coordinates.
     * @group Bounds
     */
    getBoundsOfCell(x: number, y: number): RevRectangle {
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
     * Get the index of the column whose edge is closest to the coordinate at pixelX
     * @param pixelX - The horizontal coordinate.
     * @returns The column index under the coordinate at pixelX.
     * @group Column
     */
    getActiveColumnWidthEdgeClosestToPixelX(pixelX: number): number {
        const fixedColumnCount = this._columnsManager.getFixedColumnCount();
        let scrolledColumnCount = this._columnScrollAnchorIndex;
        if (scrolledColumnCount === RevScrollDimension.invalidScrollAnchorIndex) {
            scrolledColumnCount = fixedColumnCount;
        }
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
     * Get cell at offset position on canvas.
     * @param canvasXOffset - x position on canvas.
     * @param canvasYOffset - y position on canvas.
     * @returns Cell at co-ordinate or undefined if none.
     * @group Cell
     */
    findLinedHoverCellAtCanvasOffset(canvasXOffset: number, canvasYOffset: number): RevLinedHoverCell<BCS, SF> | undefined {
        this.ensureComputedOutsideAnimationFrame();
        const columnIndex = this.findLeftGridLineInclusiveColumnIndexOfCanvasOffset(canvasXOffset);
        if (columnIndex < 0) {
            return undefined;
        } else {
            const rowIndex = this.findTopGridLineInclusiveRowIndexOfCanvasOffset(canvasYOffset);
            if (rowIndex < 0) {
                return undefined;
            } else {
                const viewCell = this.findCellAtViewpointIndex(columnIndex, rowIndex, true);
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

    /**
     * @group Cell
     */
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

    /**
     * @group Column
     */
    findLeftGridLineInclusiveColumnOfCanvasOffset(canvasOffsetX: number) {
        const index = this.findLeftGridLineInclusiveColumnIndexOfCanvasOffset(canvasOffsetX);
        if (index < 0) {
            return undefined;
        } else {
            return this._columns[index];
        }
    }

    /**
     * @group Column
     */
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

    /**
     * @group Column
     */
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

    /**
     * @group Column
     */
    findIndexOfScrollableColumnClosestToCanvasOffset(canvasOffsetX: number) {
        if (!this.horizontalScrollDimension.scrollable) {
            return -1;
        } else {
            const firstScrollableColumnViewLeft = this.horizontalScrollDimension.start;
            if (canvasOffsetX < firstScrollableColumnViewLeft) {
                const firstScrollableColumnIndex = this._firstScrollableColumnIndex;
                if (firstScrollableColumnIndex === undefined) {
                    throw new RevAssertError('VFIOSCCTOF33390')
                } else {
                    return firstScrollableColumnIndex;
                }
            } else {
                const scrollableColumnsViewRightPlus1 = firstScrollableColumnViewLeft + this._scrollableColumnsViewWidth;
                if (canvasOffsetX >= scrollableColumnsViewRightPlus1) {
                    const lastScrollableColumnIndex = this._lastScrollableColumnIndex;
                    if (lastScrollableColumnIndex === undefined) {
                        throw new RevAssertError('VFIOSCCTOG33390')
                    } else {
                        return lastScrollableColumnIndex;
                    }
                } else {
                    const columnIndex = this.findLeftGridLineInclusiveColumnIndexOfCanvasOffset(canvasOffsetX);
                    if (columnIndex < 0) {
                        throw new RevAssertError('VFIOSCCTOL33390')
                    } else {
                        return columnIndex;
                    }
                }
            }
        }
    }

    /**
     * @group Row
     */
    findTopGridLineInclusiveRowOfCanvasOffset(canvasOffsetY: number) {
        const index = this.findTopGridLineInclusiveRowIndexOfCanvasOffset(canvasOffsetY);
        if (index < 0) {
            return undefined;
        } else {
            return this._rows[index];
        }
    }

    /**
     * @group Row
     */
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

    /**
     * @group Row
     */
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

    /**
     * @group Row
     */
    findIndexOfScrollableRowClosestToOffset(y: number) {
        const firstScrollableRowViewTop = this.firstScrollableRowViewTop;
        if (firstScrollableRowViewTop === undefined) {
            return -1;
        } else {
            if (y < firstScrollableRowViewTop) {
                const firstScrollableRowIndex = this._firstScrollableRowIndex;
                if (firstScrollableRowIndex === undefined) {
                    throw new RevAssertError('VFIOSRCTFF33391');
                } else {
                    return firstScrollableRowIndex;
                }
            } else {
                const lastScrollableRowIndex = this._lastScrollableRowIndex;
                if (lastScrollableRowIndex === undefined) {
                    throw new RevAssertError('VFIOSRCTOF33391');
                } else {
                    const rows = this._rows;
                    const lastScrollableRow = rows[lastScrollableRowIndex];
                    if (y >= lastScrollableRow.bottomPlus1) {
                        return lastScrollableRowIndex;
                    } else {
                        const rowIndex = this.findTopGridLineInclusiveRowIndexOfCanvasOffset(y);
                        if (rowIndex < 0) {
                            throw new RevAssertError('VFIOSRCTOL33391')
                        } else {
                            return rowIndex;
                        }
                    }
                }
            }
        }
    }

    /** @internal */
    createUnusedSpaceColumn(): RevViewLayoutColumn<BCS, SF> | undefined {
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
                    const column: RevViewLayoutColumn<BCS, SF> = {
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
                const gridRightPlus1 = this._canvas.flooredWidth;
                if (lastColumnRightPlus1 >= gridRightPlus1) {
                    return undefined;
                } else {
                    const column: RevViewLayoutColumn<BCS, SF> = {
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
     * Matrix of view values within cells in the viewport.
     * @group Values
     */
    getValuesInView(): RevDataServer.ViewValue[][] {
        const rows = Array<RevDataServer.ViewValue[]>(this._rows.length);
        for (let y = 0; y < rows.length; ++y) {
            rows[y] = Array<RevDataServer.ViewValue>(this._columns.length);
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
     * Indicates whether an active column is in view.
     * @param activeColumnIndex - the column index
     * @returns `true` if the column is in view, `false` otherwise.
     * @group Column
     */
    isActiveColumnInView(activeColumnIndex: number) {
        return this.findColumnWithActiveIndex(activeColumnIndex) !== undefined;
    }

    /**
     * @group Column
     */
    isActiveColumnFullyInView(activeColumnIndex: number) {
        return this.findFullyInViewColumnWithActiveIndex(activeColumnIndex) !== undefined;
    }

    /**
     * Get the column index matching the provided active column index.
     * @param activeColumnIndex - The grid column index.
     * @returns The given column if in view or `undefined` if not.
     * @group Column
     */
    findColumnWithActiveIndex(activeColumnIndex: number): RevViewLayoutColumn<BCS, SF> | undefined {
        const columns = this._columns;
        const columnCount = columns.length;
        if (columnCount === 0) {
            return undefined;
        } else {
            if (columnCount < 12) {
                // for small number of columns, linear search is faster
                for (let i = 0; i < columnCount; i++) {
                    const column = columns[i];
                    if (column.activeColumnIndex === activeColumnIndex) {
                        return column;
                    }
                }
                return undefined;
            } else {
                let columnIndex: number | undefined;
                // Check scrollable columns first
                const firstScrollableColumnIndex = this._firstScrollableColumnIndex;
                if (firstScrollableColumnIndex !== undefined) {
                    const firstScrollableActiveColumnIndex = columns[firstScrollableColumnIndex].activeColumnIndex;
                    if (activeColumnIndex >= firstScrollableActiveColumnIndex) {
                        columnIndex = firstScrollableColumnIndex + (activeColumnIndex - firstScrollableActiveColumnIndex);
                    }
                }

                if (columnIndex === undefined) {
                    // Check fixed columns
                    const firstColumn = columns[0];
                    const firstActiveColumnIndex = firstColumn.activeColumnIndex;
                    if (activeColumnIndex >= firstActiveColumnIndex) {
                        columnIndex = activeColumnIndex - firstActiveColumnIndex;
                    }
                }

                if (columnIndex === undefined) {
                    return undefined;
                } else {
                    if (columnIndex >= columnCount) {
                        return undefined;
                    } else {
                        return columns[columnIndex];
                    }
                }
            }
        }
    }

    /**
     * Get the column in viewport with the provided field index.
     * @param fieldIndex - The grid column index.
     * @returns The column if found and in viewport, otherwise `undefined`.
     * @group Column
     */
    findColumnWithFieldIndex(fieldIndex: number): RevViewLayoutColumn<BCS, SF> | undefined {
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

    /**
     * Get the row in viewport with the provided subgrid row index and subgrid.
     * @param subgridRowIndex - The index of the row within the specified subgrid.
     * @param subgrid - The subgrid to which the row belongs.
     * @returns The given row if in viewport or `undefined` if not.
     * @group Row
     */
    findRowWithSubgridRowIndex(subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): RevViewLayoutRow<BCS, SF> | undefined {
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

    /**
     * @group Column
     */
    findFullyInViewColumnWithActiveIndex(activeColumnIndex: number): RevViewLayoutColumn<BCS, SF> | undefined {
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
                        return this.firstScrollableColumnIsMaximallyInView ? columns[columnIndex] : undefined;
                    } else {
                        if (columnIndex === columnCount - 1) {
                            return this.lastScrollableColumnIsMaximallyInView ? columns[columnIndex] : undefined;
                        } else {
                            return columns[columnIndex];
                        }
                    }
                }
            }
        }
    }

    /**
     * Check if a field column is in viewport.
     * A column will not be in viewport if it is either not active or scrolled out of view.
     * @param fieldIndex - the column's field index
     * @group Column
     */
    isFieldColumnInView(fieldIndex: number) {
        return this.findColumnWithFieldIndex(fieldIndex) !== undefined;
    }

    /**
     * Limit an active column index value to within the range of active column indices of columns that are scrollable.
     * @param activeColumnIndex - The active column index to limit.
     * @returns The passed `activeColumnIndex` if it is within the range of scrollable columns, or the active column index of the closest scrollable column or `undefined` if no scrollable columns are present.
     * @group Column
     */
    limitActiveColumnIndexToScrollableRange(activeColumnIndex: number) {
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

            const inViewColumnCount = columns.length;
            const lastScrollableColumn = columns[inViewColumnCount - 1];
            const lastScrollableActiveColumnIndex = lastScrollableColumn.activeColumnIndex;
            if (activeColumnIndex > lastScrollableActiveColumnIndex) {
                activeColumnIndex = lastScrollableActiveColumnIndex;
            }

            return activeColumnIndex;
        }
    }

    /**
     * Check if a subgrid row is in view.
     * @param rowIndex - The index of the row (within a subgrid) to check.
     * @param subgrid - The subgrid to check against.
     * @returns `true` if the row is in view, otherwise `false`.
     * @group Row
     */
    isSubgridRowInView(rowIndex: number, subgrid: RevSubgrid<BCS, SF>): boolean {
        return this.findRowWithSubgridRowIndex(rowIndex, subgrid) !== undefined;
    }

    /**
     * Limit a row index value to within the range of indices of rows that are scrollable.
     * @param rowIndex - The row index to limit.
     * @returns The passed `rowIndex` if it is within the range of scrollable rows, or the index of the closest scrollable row or `undefined` if no scrollable rows are present.
     * @group Row
     */
    limitRowIndexToScrollableRange(rowIndex: number) {
        const firstScrollableRowIndex = this.firstScrollableRowIndex;
        if (firstScrollableRowIndex === undefined) {
            return undefined;
        } else {
            const rows = this._rows;
            const firstScrollableRow = rows[firstScrollableRowIndex];
            const redundantFirstScrollableRowIndex = firstScrollableRow.index; // should be same
            if (rowIndex < redundantFirstScrollableRowIndex) {
                rowIndex = redundantFirstScrollableRowIndex;
            }

            const rowCount = rows.length;
            const lastScrollableRow = rows[rowCount - 1];
            const lastScrollableRowIndex = lastScrollableRow.index;
            if (rowIndex > lastScrollableRowIndex) {
                rowIndex = lastScrollableRowIndex;
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
     * @returns The last col was rendered (is in view)
     * @group Column
     */
    isLastActiveColumnInView(): boolean {
        const lastColumnIndex = this._columnsManager.activeColumnCount - 1;
        return !!this._columns.find((vc) => { return vc.activeColumnIndex === lastColumnIndex; });
    }

    /**
     * @returns The rendered column width at index
     * @group Bounds
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
     * @group Bounds
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

    /**
     * Calculates the scroll anchor for a page left scroll action.
     * Warning: NOT IMPLEMENTED
     * @returns A new scroll anchor which can be used for page left scrolling or `undefined` if a left scroll operation is not possible.
     * @group Anchor
     */
    calculatePageLeftColumnAnchor(): RevViewLayout.ScrollAnchor | undefined {
        return undefined;
    }

    /**
     * Calculates the scroll anchor for a page right scroll action.
     * Warning: NOT IMPLEMENTED
     * @returns A new scroll anchor which can be used for page right scrolling or `undefined` if a right scroll operation is not possible.
     * @group Anchor
     */
    calculatePageRightColumnAnchor(): RevViewLayout.ScrollAnchor | undefined {
        return undefined;
    }

    /**
     * @returns The row to go to for a page up.
     * @group Anchor
     */
    calculatePageUpRowAnchor(): RevViewLayout.ScrollAnchor | undefined {
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
     * @group Anchor
     */
    calculatePageDownRowAnchor(): RevViewLayout.ScrollAnchor | undefined {
        const lastScrollableRowSubgridRowIndex = this.lastScrollableRowSubgridRowIndex;
        if (lastScrollableRowSubgridRowIndex === undefined) {
            return undefined;
        } else {
            let rowIndex = lastScrollableRowSubgridRowIndex;
            const finishLimitIndex = this.verticalScrollDimension.finishScrollAnchorLimitIndex;
            if (rowIndex > finishLimitIndex) {
                rowIndex = finishLimitIndex; // assumes row heights do not differ - fix in future
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
     * Finds a cell at the specified grid row and column.
     * @param activeColumnIndex - index of active column within grid
     * @param subgridRowIndex - index of row within its subgrid within the grid
     * @param subgrid - the subgrid to search within
     * @param canComputePool - whether the pool can be recomputed (set to false if called from within animation frame)
     * @returns the cell at the specified index, or undefined if not found
     * @group Cell
     */
    findCellAtGridPoint(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>, canComputePool: boolean) {
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

    /**
     * Finds a cell at the specified data point.
     * @param fieldColumnIndex - index of field column within grid
     * @param subgridRowIndex - index of row within its subgrid within the grid
     * @param subgrid - the subgrid to search within
     * @returns the cell at the specified index, or undefined if not found
     * @group Cell
     */
    findCellAtDataPoint(fieldColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>) {
        const column = this.findColumnWithFieldIndex(fieldColumnIndex);
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

    /**
     * Finds a cell at the specified viewport row and column.
     * @param viewportColumnIndex - index of column within viewport
     * @param viewportRowIndex - index of row within viewport
     * @param canComputePool - whether the pool can be recomputed (set to false if called from within animation frame)
     * @returns the cell at the specified index, or undefined if not found
     * @group Cell
     */
    findCellAtViewpointIndex(viewportColumnIndex: number, viewportRowIndex: number, canComputePool: boolean): RevViewCell<BCS, SF> {
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
                    throw new RevAssertError('VLFCAVI22290');
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

    /**
     * Finds a cell at the specified canvas offset.
     * @param x - The x-coordinate of the canvas offset.
     * @param y - The y-coordinate of the canvas offset.
     * @returns The cell at the specified canvas offset, or undefined if not found.
     * @group Cell
     */
    findCellAtCanvasOffset(x: number, y: number) {
        // do NOT call from within animation frame
        return this.findCellAtCanvasOffsetSpecifyRecompute(x, y, true);
    }

    /** @internal */
    findCellAtCanvasOffsetSpecifyRecompute(x: number, y: number, canComputePool: boolean) {
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
                return cell;
            }
        }
    }

    /**
     * @group Pool
     */
    resetAllCellPaintFingerprints() {
        this.resetPoolAllCellPaintFingerprints(this._columnRowOrderedCellPool);
        this.resetPoolAllCellPaintFingerprints(this._rowColumnOrderedCellPool);
    }

    /**
     * @group Pool
     */
    resetAllCellPropertiesCaches() {
        this.resetPoolAllCellPropertiesCaches(this._columnRowOrderedCellPool);
        this.resetPoolAllCellPropertiesCaches(this._rowColumnOrderedCellPool);
    }

    /** @internal */
    private handleHorizontalScrollDimensionComputedEvent(withinAnimationFrame: boolean) {
        // called within animation frame
        const horizontalScrollDimension = this.horizontalScrollDimension;
        if (this._canvas.flooredWidth === 0) {
            return undefined;
        } else {
            const limitedAnchor = horizontalScrollDimension.calculateLimitedScrollAnchorIfRequired(
                this._columnScrollAnchorIndex,
                this._columnScrollAnchorOffset,
                true,
            );
            if (limitedAnchor !== undefined) {
                this._columnScrollAnchorIndex = limitedAnchor.index;
                this._columnScrollAnchorOffset = limitedAnchor.offset;
            }

            if (this._columnScrollAnchorIndex === RevScrollDimension.invalidScrollAnchorIndex) {
                return undefined;
            } else {
                const viewportStart = horizontalScrollDimension.calculateHorizontalScrollableLeft(this._columnScrollAnchorIndex, this._columnScrollAnchorOffset);
                if (withinAnimationFrame) {
                    setTimeout(() => { this.invalidateHorizontalAll(false); }, 0);
                } else {
                    this.invalidateHorizontalAll(false);
                }
                return viewportStart;
            }
        }
    }

    /** @internal */
    private handleVerticalScrollDimensionComputedEvent(withinAnimationFrame: boolean) {
        const preMainRowCount = this._subgridsManager.calculatePreMainRowCount();
        this._preMainRowCount = preMainRowCount;

        const verticalScrollDimension = this.verticalScrollDimension;
        if (this._canvas.flooredHeight === 0) {
            return undefined;
        } else {
            const limitedAnchor = verticalScrollDimension.calculateLimitedScrollAnchorIfRequired(
                this._rowScrollAnchorIndex,
                this._rowScrollAnchorOffset,
                false,
            );
            if (limitedAnchor !== undefined) {
                this._rowScrollAnchorIndex = limitedAnchor.index;
                this._rowScrollAnchorOffset = limitedAnchor.offset;
            }

            if (this._rowScrollAnchorIndex === RevScrollDimension.invalidScrollAnchorIndex) {
                return undefined;
            } else {
                const viewportStart = this._rowScrollAnchorIndex + preMainRowCount;
                if (withinAnimationFrame) {
                    setTimeout(() => { this.invalidateVerticalAll(false); }, 0);
                } else {
                    this.invalidateVerticalAll(false);
                }
                return viewportStart;
            }
        }
    }

    /** @internal */
    private notifyCellPoolComputed() {
        this.cellPoolComputedEventerForFocus();
        this.cellPoolComputedEventerForMouse();
    }

    /**
     * This function creates several data structures:
     * * {@link RevViewLayout#_columns}
     * * {@link RevViewLayout#_rows}
     *
     * Original comment:
     * "this function computes the grid coordinates used for extremely fast iteration over
     * painting the grid cells. this function is very fast, for thousand rows X 100 columns
     * on a modest machine taking usually 0ms and no more that 3 ms."
     *
     * @internal
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
            const viewColumnWidthAdjust = gridSettings.viewColumnWidthAdjust;
            const gridLinesVWidth = gridSettings.verticalGridLinesWidth;

            const fixedColumnCount = this._columnsManager.getFixedColumnCount();
            const columnScrollAnchorIndex = this._columnScrollAnchorIndex;
            const columnScrollAnchorOffset = this._columnScrollAnchorOffset;
            const lastFixedColumnIndex = fixedColumnCount - 1;

            let usableColumnScrollAnchorIndex: number;
            if (columnScrollAnchorIndex < 0) {
                usableColumnScrollAnchorIndex = fixedColumnCount;
            } else {
                if (columnScrollAnchorIndex < fixedColumnCount || columnScrollAnchorIndex >= activeColumnCount) {
                    throw new RevAssertError('VLCH60009');
                } else {
                    usableColumnScrollAnchorIndex = columnScrollAnchorIndex;
                }
            }
            let fixedWidthV: number;

            if (gridSettings.verticalFixedLineWidth === undefined) {
                fixedWidthV = gridLinesVWidth;
            } else {
                fixedWidthV = gridSettings.verticalFixedLineWidth;
            }

            const gridWidth = this._canvas.flooredWidth; // horizontal pixel loop limit

            let viewportStart: number | undefined;
            let startX: number; // horizontal pixel loop index
            let startActiveColumnIndex: number; // first column in view
            if (!gridRightAligned) {
                startX = 0;
                startActiveColumnIndex = 0;
            } else {
                // We want to right align the grid in the canvas.  The last column (after scrolling) is always in the view.  Work backwards to see which
                // column is the first in view and what its x position is.

                startActiveColumnIndex = activeColumnCount;
                viewportStart = this.horizontalScrollDimension.start + this.horizontalScrollDimension.size;
                startX = gridWidth;
                let first = true;

                do {
                    startActiveColumnIndex--;
                    const columnWidth = columnsManager.getActiveColumnRoundedWidth(startActiveColumnIndex);
                    if (startActiveColumnIndex > usableColumnScrollAnchorIndex) {
                        // not shown in grid so does not affect startX
                        viewportStart -= columnWidth;
                        if (!first) {
                            viewportStart -= gridLinesVWidth;
                        }
                    } else {
                        if (startActiveColumnIndex === usableColumnScrollAnchorIndex) {
                            if (!first) {
                                startX -= gridLinesVWidth;
                                viewportStart -= gridLinesVWidth;
                            }
                            startX -= columnWidth - columnScrollAnchorOffset;
                            viewportStart -= (columnScrollAnchorOffset + this.horizontalScrollDimension.viewportSize);
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

            // Now that start has been calculated, can calculate view column values
            columns.length = activeColumnCount - startActiveColumnIndex; // maximum length
            let x = startX;
            let nonFixedStartX = startX < 0 ? 0 : startX;
            let scrollX = nonFixedStartX;
            let viewColumnCount = 0;
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

                    if (gridRightAligned || activeColumnIndex < fixedColumnCount || activeColumnIndex >= usableColumnScrollAnchorIndex) {
                        let left: number;
                        let activeColumnOrAnchoredWidth = activeColumnWidth;
                        if (activeColumnIndex === usableColumnScrollAnchorIndex) {
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

                        let inViewWidth: number;
                        if (!isFirstNonFixedColumn) {
                            inViewWidth = activeColumnWidth;
                        } else {
                            this._firstScrollableColumnIndex = viewColumnCount;
                            if (gridRightAligned) {
                                // if nonFixedStartX is defined, then first non fixed column is
                                if (left < nonFixedStartX) {
                                    const overflow = nonFixedStartX - left;
                                    this._unanchoredColumnOverflow = overflow;
                                    if (viewColumnWidthAdjust) {
                                        inViewWidth = activeColumnWidth - overflow;
                                        left = nonFixedStartX;
                                    } else {
                                        inViewWidth = activeColumnWidth;
                                    }
                                } else {
                                    this._unanchoredColumnOverflow = 0;
                                    inViewWidth = activeColumnWidth;
                                }
                            } else {
                                if (left < x) {
                                    const offset = x - left;
                                    if (viewColumnWidthAdjust) {
                                        left = x;
                                        inViewWidth = activeColumnWidth - offset;
                                        viewportStart = scrollX + offset;
                                    } else {
                                        inViewWidth = activeColumnWidth;
                                        viewportStart = scrollX;
                                    }
                                } else {
                                    inViewWidth = activeColumnWidth;
                                    viewportStart = scrollX;
                                }
                            }
                        }
                        // if (viewColumnWidthAdjust) {
                        //     if (gridRightAligned) {
                        //         if (isFirstNonFixedColumn && left < 0) {
                        //             viewWidth += left;
                        //             left = 0;
                        //         }
                        //     } else {
                        //         if (isFirstNonFixedColumn && left < firstNonFixedColumnLeft) {
                        //             viewWidth -= (firstNonFixedColumnLeft - left);
                        //             left = firstNonFixedColumnLeft;
                        //         }
                        //     }
                        //     if (left + viewWidth > gridWidth) {
                        //         viewWidth = gridWidth - left;
                        //     }
                        // }
                        inViewWidth = Math.floor(inViewWidth);

                        const rightPlus1 = left + inViewWidth;

                        const vc: RevViewLayoutColumn<BCS, SF> = {
                            index: viewColumnCount,
                            activeColumnIndex,
                            column: columnsManager.getActiveColumn(activeColumnIndex),
                            left,
                            width: inViewWidth,
                            rightPlus1
                        };
                        columns[viewColumnCount++] = vc;

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
            columns.length = viewColumnCount;
            if (viewColumnCount > 0) {
                const lastInViewColumnIndex = viewColumnCount - 1;
                const lastInViewColumn = columns[lastInViewColumnIndex];
                const lastInViewColumnLeft = lastInViewColumn.left;
                const lastInViewColumnOriginalAfterRight = lastInViewColumnLeft + lastInViewColumn.width;
                if (lastInViewColumnOriginalAfterRight > gridWidth) {
                    const overflow = lastInViewColumnOriginalAfterRight - gridWidth;
                    if (viewColumnWidthAdjust) {
                        lastInViewColumn.width -= overflow;
                    }

                    if (!gridRightAligned) {
                        this._unanchoredColumnOverflow = overflow;
                    }

                    scrollableColumnsViewWidth = lastInViewColumnLeft + lastInViewColumn.width - nonFixedStartX;
                } else {
                    if (lastInViewColumnOriginalAfterRight === gridWidth) {
                        if (!gridRightAligned) {
                            this._unanchoredColumnOverflow = 0;
                        }
                    }
                    scrollableColumnsViewWidth = lastInViewColumnOriginalAfterRight - nonFixedStartX;
                }
                if (lastInViewColumn.activeColumnIndex >= fixedColumnCount) {
                    this._lastScrollableColumnIndex = lastInViewColumnIndex;
                }
            } else {
                scrollableColumnsViewWidth = gridWidth - nonFixedStartX; // may include last grid line
            }

            this.horizontalScrollDimension.setViewportStart(viewportStart, withinAnimationFrame);
            this.updateColumnsViewWidths(fixedColumnsViewWidth, scrollableColumnsViewWidth, fixedNonFixedBorderWidth, withinAnimationFrame);
        }
        this._rowsColumnsComputationId++;
    }

    /** @internal */
    private computeVertical(withinAnimationFrame: boolean) {
        const gridSettings = this._gridSettings;
        const fixedRowCount = this._gridSettings.fixedRowCount;
        const gridLinesHWidth = gridSettings.horizontalGridLinesWidth;

        const gridHeight = this._canvas.flooredHeight; // horizontal pixel loop limit

        const rows = this._rows;
        const subgrids = this._subgridsManager.subgridImplementations;
        const subgridCount = subgrids.length; // subgrid loop index and limit
        const rowScrollAnchorIndex = this._rowScrollAnchorIndex;
        const usableRowScrollAnchorIndex = rowScrollAnchorIndex === RevScrollDimension.invalidScrollAnchorIndex ? fixedRowCount : rowScrollAnchorIndex;

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
            if (subgridRowCount === 0) {
                subgrid.firstViewRowIndex = -1;
                subgrid.firstViewableSubgridRowIndex = -1;
                subgrid.viewRowCount = 0;
            } else {
                const isMainSubgrid = subgrid.isMain;

                subgrid.firstViewRowIndex = rowIndex;

                let afterY: number;
                let subgridRowIndex: number;
                if (isMainSubgrid) {
                    afterY = gridHeight - allPostMainSubgridsHeight; // leave room for the subgrids followin main
                    if (allPostMainSubgridsHeight > 0) {
                        afterY -= gridLinesHWidth; // also leave room for grid line between main subgrid and post main subgrids (if there are any)
                    }
                    subgridRowIndex = usableRowScrollAnchorIndex - fixedRowCount; // include row spaces for fixed rows
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

                subgrid.firstViewableSubgridRowIndex = subgridRowIndex;

                // For each row of each subgrid...
                while (subgridRowIndex < subgridRowCount && y < afterY) {
                    const height = subgrid.getRowHeight(subgridRowIndex);

                    const row: RevViewLayoutRow<BCS, SF> = {
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

                subgrid.viewRowCount = rowIndex - subgrid.firstViewRowIndex;

                if (isMainSubgrid) {
                    mainLastFixedRowIndex = undefined;

                    const subgridFirstViewRowIndex = subgrid.firstViewRowIndex;
                    if (rowIndex > subgridFirstViewRowIndex) {
                        // at least one row in main subgrid
                        const maxAfterFixedRowIndex = subgridFirstViewRowIndex + fixedRowCount; // maximum possible value of RowIndex after fixed rows
                        let afterFixedRowIndex: number; // actual RowIndex of row after fixed rows
                        if (rowIndex <= maxAfterFixedRowIndex) {
                            // only room in grid for fixed rows (if there are some, and maybe not all of them)
                            afterFixedRowIndex = rowIndex;
                        } else {
                            // all fixed rows included (if any) and at least one scrollable row in main subgrid
                            afterFixedRowIndex = maxAfterFixedRowIndex;
                            this._firstScrollableRowIndex = afterFixedRowIndex;
                            this._lastScrollableRowIndex = rowIndex - 1;
                            viewportStart = rows[afterFixedRowIndex].subgridRowIndex + this._preMainRowCount;
                        }

                        if (afterFixedRowIndex > subgridFirstViewRowIndex) {
                            // at least one fixed row
                            let fixedSugridRowIndex = 0;
                            for (let fixedRowIndex = subgridFirstViewRowIndex; fixedRowIndex < afterFixedRowIndex; fixedRowIndex++) {
                                rows[fixedRowIndex].subgridRowIndex = fixedSugridRowIndex++; // make fixed rows point to top rows in subgrid
                            }
                        }
                    }
                }
            }
        }

        this.verticalScrollDimension.setViewportStart(viewportStart, withinAnimationFrame);
        this._rowsColumnsComputationId++;
    }

    /** @internal */
    private ensureComputedOutsideAnimationFrame() {
        if (!this.horizontalScrollDimension.ensureComputedOutsideAnimationFrame()) {
            // was previously not valid
            this._horizontalComputed = false;
        }

        if (!this.verticalScrollDimension.ensureComputedOutsideAnimationFrame()) {
            // was previously not valid
            this._verticalComputed = false;
        }

        if (!this._horizontalComputed) {
            this.computeHorizontal(false);
            this._horizontalComputed = true;
        }

        if (this._verticalComputed) {
            this.computeVertical(false);
            this._verticalComputed = true;
        }
    }

    /** @internal */
    private ensureHorizontalComputedOutsideAnimationFrame() {
        if (!this.horizontalScrollDimension.ensureComputedOutsideAnimationFrame()) {
            // was previously not valid
            this._horizontalComputed = false;
        }

        if (!this._horizontalComputed) {
            this.computeHorizontal(false);
            this._horizontalComputed = true;
        }
    }

    /** @internal */
    private ensureVerticalComputedOutsideAnimationFrame() {
        if (!this.verticalScrollDimension.ensureComputedOutsideAnimationFrame()) {
            // was previously not valid
            this._verticalComputed = false;
        }

        if (!this._verticalComputed) {
            this.computeVertical(false);
            this._verticalComputed = true;
        }
    }

    /** @internal */
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
            const columnsViewWidthChangeds: RevViewLayout.ColumnsViewWidthChangeds = {
                fixedChanged: fixedColumnsViewWidthChanged,
                scrollableChanged: scrollableColumnsViewWidthChanged,
                viewChanged: columnsViewWidthChanged,
            } as const;
            if (withinAnimationFrame) {
                setTimeout(() => { this.columnsViewWidthsChangedEventer(columnsViewWidthChangeds); }, 0);
            } else {
                this.columnsViewWidthsChangedEventer(columnsViewWidthChangeds);
            }
        }
    }

    /** @internal */
    private resizeCellPool(pool: RevViewCellImplementation<BCS, SF>[], requiredSize: number) {
        const previousLength = pool.length;
        pool.length = requiredSize;

        if (requiredSize > previousLength) {
            for (let i = previousLength; i < requiredSize; i++) {
                pool[i] = new RevViewCellImplementation<BCS, SF>(this._columnsManager);
            }
        }
    }

    /** @internal */
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

    /** @internal */
    private resetPoolAllCellPaintFingerprints(pool: RevViewCellImplementation<BCS, SF>[]) {
        const cellCount = pool.length;
        for (let i = 0; i < cellCount; i++) {
            const cell = pool[i];
            cell.paintFingerprint = undefined;
        }
    }

    /** @internal */
    private resetPoolAllCellPropertiesCaches(pool: RevViewCellImplementation<BCS, SF>[]) {
        const cellCount = pool.length;
        for (let i = 0; i < cellCount; i++) {
            const cell = pool[i];
            cell.paintFingerprint = undefined;
            cell.clearCellOwnProperties();
        }
    }
}

/** @public */
export namespace RevViewLayout {
    /** @internal */
    export type LayoutInvalidatedEventer = (this: void, action: InvalidateAction) => void;
    /** @internal */
    export type ColumnsViewWidthsChangedEventer = (this: void, changeds: ColumnsViewWidthChangeds) => void;
    /** @internal */
    export type CellPoolComputedEventer = (this: void) => void;

    export interface ColumnsViewWidthChangeds {
        readonly fixedChanged: boolean,
        readonly scrollableChanged: boolean,
        readonly viewChanged: boolean,
    }

    export class ColumnArray<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends Array<RevViewLayoutColumn<BCS, SF>> {
        gap: ColumnArray.Gap | undefined;
    }

    export namespace ColumnArray {
        export interface Gap {
            left: number;
            rightPlus1: number;
        }
    }

    export class RowArray<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends Array<RevViewLayoutRow<BCS, SF>> {
        gap: RowArray.Gap | undefined;
    }

    export namespace RowArray {
        export interface Gap {
            top: number;
            bottom: number;
        }
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

    /** @internal */
    export interface InvalidateAction {
        readonly type: InvalidateAction.TypeId;
        readonly dimension: RevScrollDimension.AxisId | undefined; // undefined means both
        readonly scrollDimensionAsWell: boolean
    }

    /** @internal */
    export namespace InvalidateAction {
        export const enum TypeId {
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

    /** @internal */
    export interface AllInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.TypeId.All,
    }

    /** @internal */
    export interface LoadedInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.TypeId.Loaded,
    }

    /** @internal */
    export interface DataRangeInsertedInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.TypeId.DataRangeInserted | InvalidateAction.TypeId.DataRangeInsertedButViewNotAffected,
        readonly index: number;
        readonly count: number;
    }

    /** @internal */
    export interface DataRangeDeletedInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.TypeId.DataRangeDeleted | InvalidateAction.TypeId.DataRangeDeletedButViewNotAffected,
        readonly index: number;
        readonly count: number;
    }

    /** @internal */
    export interface ActiveRangeDeletedInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.TypeId.ActiveRangeDeleted | InvalidateAction.TypeId.ActiveRangeDeletedButViewNotAffected,
        readonly index: number;
        readonly count: number;
    }

    /** @internal */
    export interface AllDeletedInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.TypeId.AllDeleted,
    }

    /** @internal */
    export interface DataRangeMovedInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.TypeId.DataRangeMoved,
        readonly oldIndex: number;
        readonly newIndex: number;
        readonly count: number;
    }

    /** @internal */
    export interface AllChangedInvalidateAction extends InvalidateAction {
        readonly type: InvalidateAction.TypeId.AllChanged,
    }
}
