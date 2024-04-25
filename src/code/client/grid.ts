// Not used - see RevIClientGrid instead

import { Integer } from '@xilytix/sysutils';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BehaviorManager } from './behavior/behavior-manager';
import { Canvas } from './components/canvas/canvas';
import { ColumnsManager } from './components/column/columns-manager';
import { Focus } from './components/focus/focus';
import { Mouse } from './components/mouse/mouse';
import { GridPainter } from './components/renderer/grid-painter/grid-painter';
import { Renderer } from './components/renderer/renderer';
import { Scroller } from './components/scroller/scroller';
import { LastSelectionArea } from './components/selection/last-selection-area';
import { Selection } from './components/selection/selection';
import { SubgridsManager } from './components/subgrid/subgrids-manager';
import { ViewLayout } from './components/view/view-layout';
import { CellMetaSettings } from './interfaces/data/cell-meta-settings';
import { DataServer } from './interfaces/data/data-server';
import { LinedHoverCell } from './interfaces/data/hover-cell';
import { MainSubgrid } from './interfaces/data/main-subgrid';
import { MetaModel } from './interfaces/data/meta-model';
import { Subgrid } from './interfaces/data/subgrid';
import { ViewCell } from './interfaces/data/view-cell';
import { Column, ColumnAutoSizeableWidth } from './interfaces/dataless/column';
import { DatalessSubgrid } from './interfaces/dataless/dataless-subgrid';
import { SchemaField } from './interfaces/schema/schema-field';
import { SchemaServer } from './interfaces/schema/schema-server';
import { BehavioredColumnSettings } from './interfaces/settings/behaviored-column-settings';
import { BehavioredGridSettings } from './interfaces/settings/behaviored-grid-settings';
import { ColumnSettings } from './interfaces/settings/column-settings';
import { RevClientObject } from './types-utils/client-object';
import { EnsureFullyInViewEnum } from './types-utils/ensure-fully-in-view';
import { Point } from './types-utils/point';
import { Rectangle } from './types-utils/rectangle';
import { SelectionAreaType } from './types-utils/selection-area-type';

/** @public */
export interface RevGrid<BGS extends BehavioredGridSettings, BCS extends BehavioredColumnSettings, SF extends SchemaField> extends RevClientObject {
    readonly id: string;
    readonly clientId: string;
    readonly internalParent: RevClientObject | undefined;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    readonly externalParent: unknown | undefined;
    readonly hostElement: HTMLElement;

    readonly mouse: Mouse<BGS, BCS, SF>;
    readonly selection: Selection<BGS, BCS, SF>;
    readonly focus: Focus<BGS, BCS, SF>;
    readonly canvas: Canvas<BGS>;
    readonly columnsManager: ColumnsManager<BCS, SF>;
    readonly subgridsManager: SubgridsManager<BCS, SF>;
    readonly viewLayout: ViewLayout<BGS, BCS, SF>;
    readonly renderer: Renderer<BGS, BCS, SF>;
    readonly horizontalScroller: Scroller<BGS, BCS, SF>;
    readonly verticalScroller: Scroller<BGS, BCS, SF>;

    readonly schemaServer: SchemaServer<SF>;
    readonly mainSubgrid: MainSubgrid<BCS, SF>;
    readonly mainDataServer: DataServer<SF>;

    readonly settings: BGS,
    readonly destroyed: boolean;

    active: boolean;

    readonly fieldColumns: readonly Column<BCS, SF>[];
    readonly activeColumns: readonly Column<BCS, SF>[];
    readonly activeColumnCount: Integer;


    readonly columnScrollAnchorIndex: Integer;
    readonly columnScrollAnchorOffset: Integer;
    readonly fixedColumnsViewWidth: Integer;
    readonly nonFixedColumnsViewWidth: Integer;
    readonly activeColumnsViewWidth: Integer;

    selectionAllAuto: boolean;

    activate(): void;
    deactivate(): void;

    reset(): void;

    registerGridPainter(key: string, constructor: GridPainter.Constructor<BGS, BCS, SF>): void;

    isActiveDocumentElement(): boolean;

    /**
     * Gets the number of rows in the main subgrid.
     * @returns The number of rows.
     */
    getSubgridRowCount(subgrid: Subgrid<BCS, SF>): Integer;

    calculateRowCount(): Integer;

    /**
     * Retrieve a data row from the main data model.
     * @returns The data row object at y index.
     * @param y - the row index of interest
     */
    getSingletonViewDataRow(y: Integer, subgrid?: Subgrid<BCS, SF>): DataServer.ViewRow;

    /**
     * Retrieve all data rows from the data model.
     * > Use with caution!
     */
    getViewData(): readonly DataServer.ViewRow[];
    getViewValue(x: Integer, y: Integer, subgrid?: Subgrid<BCS, SF>): DataServer.ViewValue;
    setValue(x: Integer, y: Integer, value: DataServer.EditValue, subgrid?: Subgrid<BCS, SF>): void;

    /**
     * @param activeIndex - The column index in question.
     * @returns The given column is fully visible.
     */
    isColumnVisible(activeIndex: Integer): boolean;

    /**
     * Get the visibility of the row matching the provided data row index.
     * @remarks Requested row may not be visible due to being scrolled out of view.
     * Determines visibility of a row.
     * @param rowIndex - The data row index.
     * @returns The given row is visible.
     */
    isDataRowVisible(r: Integer, subgrid?: Subgrid<BCS, SF>): boolean;

    /**
     * @param c - The column index in question.
     * @param rn - The grid row index in question.
     * @returns The given cell is fully is visible.
     */
    isDataVisible(c: Integer, rn: Integer): boolean;

    /**
     * Answer which data cell is under a pixel value mouse point.
     * @param offset - The mouse point to interrogate.
     */
    findLinedHoverCellAtCanvasOffset(offsetX: Integer, offsetY: Integer): LinedHoverCell<BCS, SF> | undefined;

    /**
     * @param gridCell - The pixel location of the mouse in physical grid coordinates.
     * @returns The pixel based bounds rectangle given a data cell point.
     */
    getBoundsOfCell(gridCell: Point): Rectangle;

    getSchema(): readonly SchemaField[];

    getAllColumn(allX: Integer): Column<BCS, SF>;

    /**
     * @returns A copy of the all columns array by passing the params to `Array.prototype.slice`.
     */
    getFieldColumnRange(begin?: Integer, end?: Integer): Column<BCS, SF>[];

    /**
     * @returns A copy of the active columns array by passing the params to `Array.prototype.slice`.
     */
    getActiveColumns(begin?: Integer, end?: Integer): Column<BCS, SF>[];

    getHiddenColumns(): Column<BCS, SF>[];

    setActiveColumnsAndWidthsByFieldName(columnNameWidths: ColumnsManager.FieldNameAndAutoSizableWidth[]): void;

    /**
     * Show inactive column(s) or move active column(s).
     *
     * @remarks Adds one or several columns to the "active" column list.
     *
     * @param isActiveColumnIndexes - Which list `columnIndexes` refers to:
     * * `true` - The active column list. This can only move columns around within the active column list; it cannot add inactive columns (because it can only refer to columns in the active column list).
     * * `false` - The full column list (as per column schema array). This inserts columns from the "inactive" column list, moving columns that are already active.
     *
     * @param columnIndexes - Column index(es) into list as determined by `isActiveColumnIndexes`. One of:
     * * **Scalar column index** - Adds single column at insertion point.
     * * **Array of column indexes** - Adds multiple consecutive columns at insertion point.
     *
     * This required parameter is promoted left one arg position when `isActiveColumnIndexes` omitted in which case it will be allColumnIndexes
     *
     * @param insertIndex - Insertion point, _i.e.,_ the element to insert before. A negative values skips the reinsert. Default is to insert new columns at end of active column list.
     *
     * _Promoted left one arg position when `isActiveColumnIndexes` omitted._
     *
     * @param allowDuplicateColumns - Unless true, already visible columns are removed first.
     *
     * _Promoted left one arg position when `isActiveColumnIndexes` omitted + one position when `referenceIndex` omitted._
     */
    showHideColumns(
        /** A column index or array of field indices which are to be shown or hidden */
        fieldColumnIndexes: Integer | number[],
        /** Set to undefined to add new active columns at end of list.  Set to -1 to hide specified columns */
        insertIndex?: Integer,
        /** If true, then if an existing column is already visible, it will not be removed and duplicates of that column will be present. Default: false */
        allowDuplicateColumns?: boolean,
        /** Whether this was instigated by a UI action. Default: true */
        ui?: boolean): void;
    showHideColumns(
        /** If true, then column indices specify active column indices.  Otherwise field column indices */
        indexesAreActive: boolean,
        /** A column index or array of indices.  If undefined then all of the columns as per isActiveColumnIndexes */
        columnIndexes?: Integer | number[],
        /** Set to undefined to add new active columns at end of list.  Set to -1 to hide specified columns */
        insertIndex?: Integer,
        /** If true, then if an existing column is already visible, it will not be removed and duplicates of that column will be present. Default: false */
        allowDuplicateColumns?: boolean,
        /** Whether this was instigated by a UI action. Default: true */
        ui?: boolean,
    ): void;
    // showHideColumns(
    //     fieldColumnIndexesOrIndexesAreActive: boolean | number | number[],
    //     insertIndexOrColumnIndexes?: Integer | number[],
    //     allowDuplicateColumnsOrInsertIndex?: boolean | number,
    //     uiOrAllowDuplicateColumns?: boolean,
    //     ui?: boolean,
    // ): void;

    hideActiveColumn(activeColumnIndex: Integer, ui?: boolean): void;

    clearColumns(): void;

    moveActiveColumn(fromIndex: Integer, toIndex: Integer, ui: boolean): void;

    setActiveColumns(columnFieldNameOrFieldIndexArray: readonly (Column<BCS, SF> | string | number)[]): void;

    autoSizeActiveColumnWidths(widenOnly: boolean): void;

    setActiveColumnsAutoWidthSizing(widenOnly: boolean): void;

    autoSizeFieldColumnWidth(fieldNameOrIndex: string | number, widenOnly: boolean): void;

    setColumnScrollAnchor(index: Integer, offset: Integer): boolean;

    calculateActiveColumnsWidth(): Integer;

    calculateActiveNonFixedColumnsWidth(): Integer;

    getActiveColumn(activeIndex: Integer): Column<BCS, SF>;

    getActiveColumnIndexByFieldIndex(fieldIndex: Integer): Integer;

    /**
     * @returns The width of the given column.
     * @param activeIndex - The untranslated column index.
     */
    getActiveColumnWidth(activeIndex: Integer): Integer;

    /**
     * Set the width of the given column.
     * @param columnIndex - The untranslated column index.
     * @param width - The width in pixels.
     * @returns column if width changed otherwise undefined
     */
    setActiveColumnWidth(columnOrIndex: Integer | Column<BCS, SF>, width: Integer, ui: boolean): void;

    setColumnWidths(columnWidths: ColumnAutoSizeableWidth<BCS, SF>[]): boolean;

    setColumnWidthsByName(columnNameWidths: ColumnsManager.FieldNameAndAutoSizableWidth[]): boolean;

    /**
     * @returns The height of the given row
     * @param rowIndex - The untranslated fixed column index.
     */
    getRowHeight(rowIndex: Integer, subgrid?: Subgrid<BCS, SF>): Integer;

    /**
     * Set the height of the given row.
     * @param rowIndex - The row index.
     * @param rowHeight - The width in pixels.
     */
    setRowHeight(rowIndex: Integer, rowHeight: Integer, subgrid?: Subgrid<BCS, SF>): void;

    /**
     * @returns The HiDPI ratio.
     */
    getHiDPI(): number;

    /**
     * @returns The width of the given (recently rendered) column.
     * @param colIndex - The column index.
     */
    getRenderedWidth(colIndex: Integer): Integer

    /**
     * @returns The height of the given (recently rendered) row.
     * @param rowIndex - The row index.
     */
    getRenderedHeight(rowIndex: Integer): Integer


    /**
     * @returns Objects with the values that were just rendered.
     */
    getRenderedData(): DataServer.ViewValue[][];

    /**
     * @returns The number of columns that were just rendered
     */
    getVisibleColumnsCount(): Integer;

    /**
     * @returns The number of rows that were just rendered
     */
    getVisibleRowsCount(): Integer;

    swapColumns(source: Integer, target: Integer): void;

    /**
     * @param activeColumnIndex - Data x coordinate.
     * @returns The properties for a specific column.
     */
    getActiveColumnSettings(activeColumnIndex: Integer): BCS;

    mergeFieldColumnSettings(fieldIndex: Integer, settings: Partial<BCS>): boolean;

    setFieldColumnSettings(fieldIndex: Integer, settings: BCS): boolean;

    /**
     * Clears all cell properties of given column or of all columns.
     * @param x - Omit for all columns.
     * @internal
     */
    clearAllCellProperties(x?: Integer): void;

    addEventListener(eventName: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;

    removeEventListener(eventName: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;

    // Focus
    clearFocus(): void;

    // FocusScrollBehavior

    tryFocusXYAndEnsureInView(x: Integer, y: Integer, cell?: ViewCell<BCS, SF>): boolean;

    tryFocusXAndEnsureInView(x: Integer): boolean;

    tryFocusYAndEnsureInView(y: Integer): boolean;

    tryMoveFocusLeft(): boolean;

    tryMoveFocusRight(): boolean;

    tryMoveFocusUp(): boolean;

    tryMoveFocusDown(): boolean;

    tryFocusFirstColumn(): boolean;

    tryFocusLastColumn(): boolean;

    tryFocusTop(): boolean;

    tryFocusBottom(): boolean;

    tryPageFocusLeft(): boolean;

    tryPageFocusRight(): boolean;

    tryPageFocusUp(): boolean;

    tryPageFocusDown(): boolean;

    tryScrollLeft(): boolean;

    tryScrollRight(): boolean;

    tryScrollUp(): boolean;

    tryScrollDown(): boolean;

    scrollFirstColumn(): boolean;

    scrollLastColumn(): boolean;

    scrollTop(): boolean;

    scrollBottom(): boolean;

    tryScrollPageLeft(): boolean;

    tryScrollPageRight(): boolean;

    tryScrollPageUp(): boolean;

    tryScrollPageDown(): boolean;

    /**
     * Get the cell's own properties object.
     * @remarks May be undefined because cells only have their own properties object when at lest one own property has been set.
     * @param allXOrRenderedCell - Data x coordinate or cell event.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @returns The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `undefined`.
     * @internal
     */
    getCellOwnProperties(allXOrRenderedCell: Integer | ViewCell<BCS, SF>, y?: Integer, subgrid?: Subgrid<BCS, SF>): MetaModel.CellOwnProperties | undefined;

    /**
     * Get the properties object for cell.
     * @remarks This is the cell's own properties object if found else the column object.
     *
     * If you are seeking a single specific property, consider calling {@link BehaviorManager#getCellProperty} instead.
     * @param xOrCellEvent - Data x coordinate or CellEvent.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @returns The properties of the cell at x,y in the grid or falsy if not available.
     * @internal
     */
    getCellOwnPropertiesFromRenderedCell(renderedCell: ViewCell<BCS, SF>): MetaModel.CellOwnProperties | false | null | undefined;

    /** @internal */
    getCellProperties(allX: Integer, y: Integer, subgrid: Subgrid<BCS, SF>): CellMetaSettings;

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    getCellOwnPropertyFromRenderedCell(renderedCell: ViewCell<BCS, SF>, key: string): MetaModel.CellOwnProperty | undefined;

    /**
     * Return a specific cell property.
     * @remarks If there is no cell properties object, defers to column properties object.
     * @param allX - Data x coordinate.
     * @param y - Subgrid row coordinate.
     * @param key - Name of property to get.
     * @param subgrid - Subgrid in which contains cell
     * @returns The specified property for the cell at x,y in the grid.
     * @internal
     */
    getCellProperty(allX: Integer, y: Integer, key: string | number, subgrid: Subgrid<BCS, SF>): MetaModel.CellOwnProperty;
    /** @internal */
    getCellProperty<T extends keyof ColumnSettings>(allX: Integer, y: Integer, key: T, subgrid: Subgrid<BCS, SF>): ColumnSettings[T];
    /** @internal */
    getCellProperty<T extends keyof ColumnSettings>(
        allX: Integer,
        y: Integer,
        key: string | T,
        subgrid: Subgrid<BCS, SF>
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    ): MetaModel.CellOwnProperty | ColumnSettings[T];

    /**
     * update the data at point x, y with value
     * @param xOrCellEvent - Data x coordinate.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param properties - Hash of cell properties. _When `y` omitted, this param promoted to 2nd arg._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @internal
     */
    setCellOwnPropertiesUsingCellEvent(cell: ViewCell<BCS, SF>, properties: MetaModel.CellOwnProperties): void;
    /** @internal */
    setCellOwnProperties(allX: Integer, y: Integer, properties: MetaModel.CellOwnProperties, subgrid: Subgrid<BCS, SF>): void;

    /**
     * update the data at point x, y with value
     * @param xOrCellEvent - Data x coordinate.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param properties - Hash of cell properties. _When `y` omitted, this param promoted to 2nd arg._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @internal
     */
    addCellOwnPropertiesUsingCellEvent(cell: ViewCell<BCS, SF>, properties: MetaModel.CellOwnProperties): void;
    /** @internal */
    addCellOwnProperties(allX: Integer, y: Integer, properties: MetaModel.CellOwnProperties, subgrid: Subgrid<BCS, SF>): void;

    /**
     * Set a specific cell property.
     * @remarks If there is no cell properties object, defers to column properties object.
     *
     * NOTE: For performance reasons, renderer's cell event objects cache their respective cell properties objects. This method accepts a `CellEvent` overload. Whenever possible, use the `CellEvent` from the renderer's cell event pool. Doing so will reset the cell properties object cache.
     *
     * If you use some other `CellEvent`, the renderer's `CellEvent` properties cache will not be automatically reset until the whole cell event pool is reset on the next call to {@link ViewLayout#computeCellBoundaries}. If necessary, you can "manually" reset it by calling {@link ViewLayout#resetCellPropertiesCache|resetCellPropertiesCache(yourCellEvent)} which searches the cell event pool for one with matching coordinates and resets the cache.
     *
     * The raw coordinates overload calls the `resetCellPropertiesCache(x, y)` overload for you.
     * @param xOrCellEvent - `CellEvent` or data x coordinate.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param key - Name of property to get. _When `y` omitted, this param promoted to 2nd arg._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @internal
     */
    setCellProperty(cell: ViewCell<BCS, SF>, key: string, value: MetaModel.CellOwnProperty): MetaModel.CellOwnProperties | undefined;
    /** @internal */
    setCellProperty(allX: Integer, dataY: Integer, key: string, value: MetaModel.CellOwnProperty, subgrid: Subgrid<BCS, SF>): MetaModel.CellOwnProperties | undefined;
    /** @internal */
    setCellProperty(
        allXOrCell: ViewCell<BCS, SF> | number,
        yOrKey: string | number,
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        keyOrValue: string | MetaModel.CellOwnProperty,
        value?: MetaModel.CellOwnProperty,
        subgrid?: Subgrid<BCS, SF>
    ): MetaModel.CellOwnProperties | undefined;

    // Selection

    /** Call before multiple selection changes to consolidate SelectionChange events.
     * Pair with endSelectionChange().
     */
    beginSelectionChange(): void;

    /** Call after multiple selection changes to consolidate SelectionChange events.
     * Pair with beginSelectionChange().
     */
    endSelectionChange(): void;

    clearSelection(): void;

    onlySelectCell(x: Integer, y: Integer, subgrid?: Subgrid<BCS, SF>): LastSelectionArea;

    selectCell(x: Integer, y: Integer, subgrid?: Subgrid<BCS, SF>): LastSelectionArea;

    deselectCell(x: Integer, y: Integer, subgrid: Subgrid<BCS, SF>): void;

    toggleSelectCell(x: Integer, y: Integer, subgrid?: Subgrid<BCS, SF>): boolean;

    onlySelectRectangle(firstInexclusiveX: Integer, firstInexclusiveY: Integer, width: Integer, height: Integer, subgrid?: Subgrid<BCS, SF>): LastSelectionArea;

    selectRectangle(firstInexclusiveX: Integer, firstInexclusiveY: Integer, width: Integer, height: Integer, subgrid: Subgrid<BCS, SF>): LastSelectionArea;

    deselectRectangle(rectangle: Rectangle, subgrid: Subgrid<BCS, SF>): void;

    deselectRow(y: Integer, subgrid?: Subgrid<BCS, SF>): void;

    deselectRows(y: Integer, count: Integer, subgrid?: Subgrid<BCS, SF>): void;

    deselectColumn(x: Integer, subgrid: Subgrid<BCS, SF>): void;

    deselectColumns(x: Integer, count: Integer, subgrid: Subgrid<BCS, SF>): void;

    isCellSelected(x: Integer, y: Integer, subgrid?: Subgrid<BCS, SF>): boolean;

    /** Returns undefined if not selected, false if selected with others, true if the only cell selected */
    isOnlyThisCellSelected(x: Integer, y: Integer, subgrid?: DatalessSubgrid): boolean | undefined;

    getOneCellSelectionAreaType(activeColumnIndex: Integer, subgridRowIndex: Integer, subgrid: DatalessSubgrid): SelectionAreaType | undefined;

    getAllCellSelectionAreaTypeIds(activeColumnIndex: Integer, subgridRowIndex: Integer, subgrid: DatalessSubgrid): SelectionAreaType[];

    isSelectedCellTheOnlySelectedCell(
        activeColumnIndex: Integer,
        subgridRowIndex: Integer,
        datalessSubgrid: DatalessSubgrid,
        selectedType?: SelectionAreaType,
    ): boolean;

    areColumnsOrRowsSelected(includeAllAuto?: boolean): boolean;

    areRowsSelected(includeAllAuto: boolean): boolean;

    getSelectedRowCount(includeAllAuto?: boolean): Integer;

    getSelectedAllAutoRowCount(): Integer;

    getSelectedRowIndices(includeAllAuto?: boolean): Integer[];

    getSelectedAllAutoRowIndices(): Integer[];

    areColumnsSelected(includeAllAuto?: boolean): boolean;

    getSelectedColumnIndices(includeAllAuto?: boolean): Integer[];

    // FocusSelectBehavior

    selectColumn(activeColumnIndex: Integer): void;

    selectColumns(activeColumnIndex: Integer, count: Integer): void;

    onlySelectColumn(activeColumnIndex: Integer): void;

    onlySelectColumns(activeColumnIndex: Integer, count: Integer): void;

    toggleSelectColumn(activeColumnIndex: Integer): void;

    selectRow(subgridRowIndex: Integer, subgrid?: Subgrid<BCS, SF>): void;

    selectRows(subgridRowIndex: Integer, count: Integer, subgrid?: Subgrid<BCS, SF>): void;

    selectAllRows(subgrid?: Subgrid<BCS, SF>): void;

    onlySelectRow(subgridRowIndex: Integer, subgrid?: Subgrid<BCS, SF>): void;

    onlySelectRows(subgridRowIndex: Integer, count: Integer, subgrid?: Subgrid<BCS, SF>): void;

    toggleSelectRow(subgridRowIndex: Integer, subgrid?: Subgrid<BCS, SF>): void;

    focusOnlySelectRectangle(inexclusiveX: Integer, inexclusiveY: Integer, width: Integer, height: Integer, subgrid?: Subgrid<BCS, SF>, ensureFullyInView?: EnsureFullyInViewEnum): void;

    focusOnlySelectCell(activeColumnIndex: Integer, subgridRowIndex: Integer, subgrid?: Subgrid<BCS, SF>, ensureFullyInView?: EnsureFullyInViewEnum): void;

    onlySelectViewCell(viewLayoutColumnIndex: Integer, viewLayoutRowIndex: Integer): void;

    focusSelectCell(x: Integer, y: Integer, subgrid?: Subgrid<BCS, SF>, ensureFullyInView?: EnsureFullyInViewEnum): void;

    focusToggleSelectCell(originX: Integer, originY: Integer, subgrid?: Subgrid<BCS, SF>, ensureFullyInView?: EnsureFullyInViewEnum): boolean;

    tryOnlySelectFocusedCell(): boolean;

    focusReplaceLastArea(
        areaType: SelectionAreaType,
        inexclusiveX: Integer,
        inexclusiveY: Integer,
        width: Integer,
        height: Integer,
        subgrid?: Subgrid<BCS, SF>,
        ensureFullyInView?: EnsureFullyInViewEnum,
    ): void;

    focusReplaceLastAreaWithRectangle(
        inexclusiveX: Integer,
        inexclusiveY: Integer,
        width: Integer,
        height: Integer,
        subgrid?: Subgrid<BCS, SF>,
        ensureFullyInView?: EnsureFullyInViewEnum,
    ): void;

    tryExtendLastSelectionAreaAsCloseAsPossibleToFocus(): boolean;
}
