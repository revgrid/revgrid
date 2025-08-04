import { Integer } from '@pbkware/js-utils';
import {
    RevApiError,
    RevAssertError,
    RevClientObject,
    RevCssTypes,
    RevDataServer,
    RevEnsureFullyInViewEnum,
    RevListChangedTypeId,
    RevMetaServer,
    RevPoint,
    RevRectangle,
    RevSchemaField,
    RevSchemaServer,
    RevSelectionAreaType,
} from '../common';
import { RevBehaviorManager } from './behavior/behavior-manager';
import { RevCellPropertiesBehavior } from './behavior/cell-properties-behavior';
import { RevDataExtractBehavior } from './behavior/data-extract-behavior';
import { RevEventBehavior } from './behavior/event-behavior';
import { RevFocusScrollBehavior } from './behavior/focus-scroll-behavior';
import { RevFocusSelectBehavior } from './behavior/focus-select-behavior';
import { RevRowPropertiesBehavior } from './behavior/row-properties-behavior';
import { RevCanvas } from './components/canvas/canvas';
import { RevColumnsManager } from './components/column/columns-manager';
import { RevComponentsManager } from './components/components-manager';
import { RevFocus } from './components/focus/focus';
import { RevMouse } from './components/mouse/mouse';
import { RevGridPainter } from './components/renderer/grid-painter/grid-painter';
import { RevRenderer } from './components/renderer/renderer';
import { RevScroller } from './components/scroller/scroller';
import { RevLastSelectionArea } from './components/selection/last-selection-area';
import { RevSelection } from './components/selection/selection';
import { RevSelectionRows } from './components/selection/selection-rows';
import { RevSubgridsManager } from './components/subgrid/subgrids-manager';
import { RevViewLayout } from './components/view/view-layout';
import { RevGridDefinition } from './grid-definition';
import { RevGridOptions } from './grid-options';
import { RevIdGenerator } from './id-generator';
import { RevCellMetaSettings, RevColumn, RevColumnAutoSizeableWidth, RevLinedHoverCell, RevMainSubgrid, RevSubgrid, RevViewCell } from './interfaces';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevColumnSettings } from './settings';
import { RevUiManager } from './ui/ui-controller-manager';

/** @public */
export class RevClientGrid<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    readonly id: string;
    readonly clientId: string;
    readonly internalParent: RevClientObject | undefined = undefined;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    readonly externalParent: unknown | undefined;
    readonly hostElement: HTMLElement;

    readonly mouse: RevMouse<BGS, BCS, SF>;
    readonly selection: RevSelection<BGS, BCS, SF>;
    readonly focus: RevFocus<BGS, BCS, SF>;
    readonly canvas: RevCanvas<BGS>;
    readonly columnsManager: RevColumnsManager<BCS, SF>;
    readonly subgridsManager: RevSubgridsManager<BCS, SF>;
    readonly viewLayout: RevViewLayout<BGS, BCS, SF>;
    readonly renderer: RevRenderer<BGS, BCS, SF>;
    readonly horizontalScroller: RevScroller<BGS, BCS, SF>;
    readonly verticalScroller: RevScroller<BGS, BCS, SF>;

    readonly schemaServer: RevSchemaServer<SF>;
    readonly mainSubgrid: RevMainSubgrid<BCS, SF>;
    readonly mainDataServer: RevDataServer<SF>;

    /** @internal */
    private readonly _componentsManager: RevComponentsManager<BGS, BCS, SF>;
    /** @internal */
    private readonly _behaviorManager: RevBehaviorManager<BGS, BCS, SF>;
    /** @internal */
    private readonly _uiManager: RevUiManager<BGS, BCS, SF>;

    /** @internal */
    private readonly _focusScrollBehavior: RevFocusScrollBehavior<BGS, BCS, SF>;
    /** @internal */
    private readonly _focusSelectBehavior: RevFocusSelectBehavior<BGS, BCS, SF>;
    /** @internal */
    private readonly _dataExtractBehavior: RevDataExtractBehavior<BGS, BCS, SF>;
    /** @internal */
    private readonly _rowPropertiesBehavior: RevRowPropertiesBehavior<BGS, BCS, SF>;
    /** @internal */
    private readonly _cellPropertiesBehavior: RevCellPropertiesBehavior<BGS, BCS, SF>;

    private _destroyed = false;

    constructor(
        hostElement: string | HTMLElement | undefined,
        definition: RevGridDefinition<BCS, SF>,
        readonly settings: BGS,
        getSettingsForNewColumnEventer: RevClientGrid.GetSettingsForNewColumnEventer<BCS, SF>,
        options?: RevGridOptions<BGS, BCS, SF>
    ) {
        //Set up the host for a grid instance
        this.hostElement = this.prepareHost(hostElement);

        options = options ?? {};

        const id = RevClientGrid.idGenerator.generateId(options.id, this.hostElement.id, options.firstGeneratedIdFromBaseIsAlsoNumbered);
        this.id = id;
        this.clientId = this.id;
        this.externalParent = options.externalParent;

        let schemaServer = definition.schemaServer;
        if (typeof schemaServer === 'function') {
            schemaServer = new schemaServer();
        }

        this.schemaServer = schemaServer;

        this._componentsManager = new RevComponentsManager(
            this.clientId,
            this,
            settings,
            this.hostElement,
            schemaServer,
            definition.subgrids,
            options.canvasOverflowOverride,
            options.canvasRenderingContext2DSettings,
            getSettingsForNewColumnEventer,
        );

        this.focus = this._componentsManager.focus;
        this.selection = this._componentsManager.selection;
        this.canvas = this._componentsManager.canvas;
        this.mouse = this._componentsManager.mouse;
        this.columnsManager = this._componentsManager.columnsManager;
        this.subgridsManager = this._componentsManager.subgridsManager;
        this.viewLayout = this._componentsManager.viewLayout;
        this.renderer = this._componentsManager.renderer;
        this.horizontalScroller = this._componentsManager.horizontalScroller;
        this.verticalScroller = this._componentsManager.verticalScroller;

        this.mainSubgrid = this.subgridsManager.mainSubgrid;
        this.mainDataServer = this.mainSubgrid.dataServer;

        const descendantEventer = this.createDescendantEventer();

        this._behaviorManager = new RevBehaviorManager(
            this.clientId,
            this,
            this.settings,
            this.canvas,
            this.columnsManager,
            this.subgridsManager,
            this.viewLayout,
            this.focus,
            this.selection,
            this.mouse,
            this.renderer,
            this.horizontalScroller,
            this.verticalScroller,
            descendantEventer,
        );

        this._focusScrollBehavior = this._behaviorManager.focusScrollBehavior;
        this._focusSelectBehavior = this._behaviorManager.focusSelectBehavior;
        this._rowPropertiesBehavior = this._behaviorManager.rowPropertiesBehavior;
        this._cellPropertiesBehavior = this._behaviorManager.cellPropertiesBehavior;
        this._dataExtractBehavior = this._behaviorManager.dataExtractBehavior;

        this._uiManager = new RevUiManager(
            this.clientId,
            this,
            this.hostElement,
            this.settings,
            this.canvas,
            this.focus,
            this.selection,
            this.columnsManager,
            this.subgridsManager,
            this.viewLayout,
            this.renderer,
            this.mouse,
            this.horizontalScroller,
            this.verticalScroller,
            this._focusScrollBehavior,
            this._focusSelectBehavior,
            this._rowPropertiesBehavior,
            this._cellPropertiesBehavior,
            this._dataExtractBehavior,
            this._behaviorManager.reindexBehavior,
            this._behaviorManager.eventBehavior,
            options.customUiControllerDefinitions,
        );
    }

    get destroyed() { return this._destroyed; }

    get active() { return this._behaviorManager.active; }
    set active(value: boolean) {
        this._behaviorManager.active = value;
        if (!value){
            this.renderer.stop();
            this.canvas.stop();
            this._uiManager.disable();
        } else {
            this._uiManager.enable();
            this.canvas.start();
            this.renderer.start();
            this.canvas.resize(false); // Will invalidate all and cause a repaint
        }
    }

    // ColumnsManager getter/setters
    get fieldColumns(): readonly RevColumn<BCS, SF>[] { return this.columnsManager.fieldColumns; }
    get activeColumns(): readonly RevColumn<BCS, SF>[] { return this.columnsManager.activeColumns; }

    // ViewLayout getter/setters
    /**
     * The index of the active column which is first in view (either on left or right depending on Grid alignment)
     */
    get columnScrollAnchorIndex() { return this.viewLayout.columnScrollAnchorIndex; }
    /**
     * The number of pixels that the scroll anchored column is offset.
     * Changes to allow smooth scrolling
     */
    get columnScrollAnchorOffset() { return this.viewLayout.columnScrollAnchorOffset; }
    get fixedColumnsViewWidth() { return this.viewLayout.fixedColumnsViewWidth; }
    get nonFixedColumnsViewWidth() { return this.viewLayout.scrollableColumnsViewWidth; }
    get activeColumnsViewWidth() { return this.viewLayout.columnsViewWidth; }

    // RevSelection getters/setters
    get selectionDynamicAllSubgrids() { return this.selection.dynamicAllSubgrids; }

    get activeColumnCount() { return this.columnsManager.activeColumnCount; }

    /**
     * Be a responsible citizen and call this function on instance disposal!
     * If multiple grids are used in an application (simultaneously or not), then `destroy()` must be called otherwise
     * canvase paint loop will continue to run
     */
    destroy() {
        this.deactivate();

        this._behaviorManager.destroy();

        const hostElement = this.hostElement;
        let firstChild = hostElement.firstChild;
        while (firstChild !== null) {
            hostElement.removeChild(firstChild);
            firstChild = hostElement.firstChild;
        }

        this._destroyed = true;
    }

    activate() {
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }

    /**
     * Reset all components, resize and invalidate all
     */
    reset() {
        this._componentsManager.reset();
        this.canvas.resize(false); // Will invalidate all and cause a repaint
    }

    registerGridPainter(key: string, constructor: RevGridPainter.Constructor<BGS, BCS, SF>) {
        this.renderer.registerGridPainter(key, constructor)
    }

    /**
     * @returns We have focus.
     */
    isActiveDocumentElement() {
        return this.canvas.isActiveDocumentElement();
    }

    /**
     * Gets the number of rows in the main subgrid.
     * @returns The number of rows.
     */
    getSubgridRowCount(subgrid: RevSubgrid<BCS, SF>) {
        return subgrid.getRowCount();
    }

    calculateRowCount() {
        return this.subgridsManager.calculateRowCount();
    }

    /**
     * Retrieve a data row from the main data model.
     * @returns The data row object at y index.
     * @param subgridRowIndex - the row index of interest
     */
    getSingletonViewDataRow(subgridRowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>): RevDataServer.ViewRow {
        if (subgrid === undefined) {
            return this.mainSubgrid.getSingletonViewDataRow(subgridRowIndex);
        } else {
            return subgrid.getSingletonViewDataRow(subgridRowIndex);
        }
    }

    /**
     * Retrieve all data rows from the data model.
     * Use with caution!
     */
    getViewData(): readonly RevDataServer.ViewRow[] {
        const mainDataServer = this.mainDataServer;
        if (mainDataServer.getViewData === undefined) {
            return [];
        } else {
            return mainDataServer.getViewData();
        }
    }

    getViewValue(activeColumnIndex: Integer, subgridRowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>) {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        return this._componentsManager.getViewValue(activeColumnIndex, subgridRowIndex, subgrid);
    }

    setValue(activeColumnIndex: Integer, subgridRowIndex: Integer, value: RevDataServer.EditValue, subgrid?: RevSubgrid<BCS, SF>) {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        this._componentsManager.setValue(activeColumnIndex, subgridRowIndex, value, subgrid);
    }

    /**
     * @param activeColumnIndex - The column index in question.
     * @returns The given column is fully visible.
     */
    isColumnVisible(activeColumnIndex: Integer) {
        return this.viewLayout.isActiveColumnVisible(activeColumnIndex);
    }

    /**
     * Get the visibility of the row matching the provided data row index.
     * @remarks Requested row may not be visible due to being scrolled out of view.
     * Determines visibility of a row.
     * @param subgridRowIndex - The data row index.
     * @returns The given row is visible.
     */
    isSubgridRowVisible(subgridRowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>) {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }

        return this.viewLayout.isDataRowVisible(subgridRowIndex, subgrid);
    }

    /**
     * @param activeColumnIndex - The column index in question.
     * @param subgridRowIndex - The grid row index in question.
     * @returns The given cell is fully is visible.
     */
    isCellVisible(activeColumnIndex: Integer, subgridRowIndex: Integer, subgrid = this.mainSubgrid): boolean {
        return this.isSubgridRowVisible(subgridRowIndex, subgrid) && this.isColumnVisible(activeColumnIndex);
    }

    /**
     * Find cell under offset position in canvas
     * @param canvasXOffset - X position of pixel in canvas.
     * @param canvasYOffset - Y position of pixel in canvas.
     */
    findLinedHoverCellAtCanvasOffset(canvasXOffset: Integer, canvasYOffset: Integer) {
        return this.viewLayout.findLinedHoverCellAtCanvasOffset(canvasXOffset, canvasYOffset);
    }

    /**
     * @param gridCell - The pixel location of the mouse in physical grid coordinates.
     * @returns The pixel based bounds rectangle given a data cell point.
     */
    getBoundsOfCell(gridCell: RevPoint): RevRectangle {
        return this.viewLayout.getBoundsOfCell(gridCell.x, gridCell.y);
    }

    getSchema(): readonly RevSchemaField[] {
        return this.columnsManager.getSchema();
    }

    getAllColumn(allX: Integer) {
        return this.columnsManager.getFieldColumn(allX);
    }

    /**
     * @returns A copy of the all columns array by passing the params to `Array.prototype.slice`.
     */
    getFieldColumnRange(begin?: Integer, end?: Integer): RevColumn<BCS, SF>[] {
        const columns = this.columnsManager.fieldColumns;
        return columns.slice(begin, end);
    }

    /**
     * @returns A copy of the active columns array by passing the params to `Array.prototype.slice`.
     */
    getActiveColumns(begin?: Integer, end?: Integer): RevColumn<BCS, SF>[] {
        const columns = this.columnsManager.activeColumns;
        return columns.slice(begin, end);
    }

    getHiddenColumns() {
        //A non in-memory behavior will be more troublesome
        return this.columnsManager.getHiddenColumns();
    }

    setActiveColumnsAndWidthsByFieldName(columnNameWidths: RevColumnsManager.FieldNameAndAutoSizableWidth[]) {
        this.columnsManager.setActiveColumnsAndWidthsByFieldName(columnNameWidths, false);
    }

    /**
     * Show inactive column(s) or move active column(s).
     *
     * @remarks Adds one or several columns to the "active" column list.
     *
     * @param fieldColumnIndexes - A column index or array of field indices which are to be shown or hidden.
     * @param insertIndex - Active index of column to insert before. Set to undefined to add new active columns at end of list. Set to -1 to hide specified columns.
     * @param allowDuplicateColumns - If true, then if an existing column is already visible, it will not be removed and duplicates of that column will be present. Default: false.
     * @param ui - Whether this was instigated by a UI action. Default: true.
     */
    showHideColumns(
        fieldColumnIndexes: Integer | Integer[],
        insertIndex?: Integer,
        allowDuplicateColumns?: boolean,
        ui?: boolean): void;
    /**
     * Show inactive column(s) or move active column(s).
     *
     * @remarks Adds one or several columns to the "active" column list.
     *
     * @param indexesAreActive - If true, then column indices specify active column indices.  Otherwise field column indices.
     * @param fieldColumnIndexes - A column index or array of indices.  If undefined then all of the columns as per indexesAreActive.
     * @param insertIndex - Active index of column to insert before. Set to undefined to add new active columns at end of list. Set to -1 to hide specified columns.
     * @param allowDuplicateColumns - If true, then if an existing column is already visible, it will not be removed and duplicates of that column will be present. Default: false.
     * @param ui - Whether this was instigated by a UI action. Default: true.
     */
    showHideColumns(
        indexesAreActive: boolean,
        fieldColumnIndexes?: Integer | Integer[],
        insertIndex?: Integer,
        allowDuplicateColumns?: boolean,
        ui?: boolean,
    ): void;
    showHideColumns(
        fieldColumnIndexesOrIndexesAreActive: boolean | Integer | Integer[],
        insertIndexOrColumnIndexes?: Integer | Integer[],
        allowDuplicateColumnsOrInsertIndex?: boolean | Integer,
        uiOrAllowDuplicateColumns?: boolean,
        ui = true
    ): void {
        let indexesAreActive: boolean;
        let columnIndexOrIndices: Integer | Integer[] | undefined;
        let insertIndex: Integer | undefined;
        let allowDuplicateColumns: boolean;

        // Promote args when indexesAreActive omitted
        if (typeof fieldColumnIndexesOrIndexesAreActive === 'number' || Array.isArray(fieldColumnIndexesOrIndexesAreActive)) {
            indexesAreActive = false;
            columnIndexOrIndices = fieldColumnIndexesOrIndexesAreActive;
            insertIndex = insertIndexOrColumnIndexes as number | undefined;
            allowDuplicateColumns = allowDuplicateColumnsOrInsertIndex as boolean;
            ui = uiOrAllowDuplicateColumns ?? true;
        } else {
            indexesAreActive = fieldColumnIndexesOrIndexesAreActive;
            columnIndexOrIndices = insertIndexOrColumnIndexes;
            insertIndex = allowDuplicateColumnsOrInsertIndex as number | undefined;
            allowDuplicateColumns = uiOrAllowDuplicateColumns ?? false;
        }

        this.columnsManager.showHideColumns(indexesAreActive, columnIndexOrIndices, insertIndex, allowDuplicateColumns, ui);
    }

    hideActiveColumn(activeColumnIndex: Integer, ui = true) {
        this.columnsManager.hideActiveColumn(activeColumnIndex, ui);
    }

    clearColumns() {
        this.columnsManager.clearColumns();
    }

    moveActiveColumn(fromIndex: Integer, toIndex: Integer, ui: boolean) {
        this.columnsManager.moveActiveColumn(fromIndex, toIndex, ui);
    }

    setActiveColumns(columnFieldNameOrFieldIndexArray: readonly (RevColumn<BCS, SF> | string | number)[]) {
        const fieldColumns = this.columnsManager.fieldColumns;
        const newActiveCount = columnFieldNameOrFieldIndexArray.length;
        const newActiveColumns = new Array<RevColumn<BCS, SF>>(newActiveCount);
        for (let i = 0; i < newActiveCount; i++) {
            const columnFieldNameOrFieldIndex = columnFieldNameOrFieldIndexArray[i];
            let column: RevColumn<BCS, SF>;
            if (typeof columnFieldNameOrFieldIndex === 'number') {
                column = fieldColumns[columnFieldNameOrFieldIndex];
            } else {
                if (typeof columnFieldNameOrFieldIndex === 'string') {
                    const foundColumn = fieldColumns.find((aColumn) => aColumn.field.name === columnFieldNameOrFieldIndex);
                    if (foundColumn === undefined) {
                        throw new RevApiError('RSAC20009', `RevColumnsManager.setActiveColumns: Column with name not found: ${columnFieldNameOrFieldIndex}`);
                    } else {
                        column = foundColumn;
                    }
                } else {
                    column = columnFieldNameOrFieldIndex;
                }
            }

            newActiveColumns[i] = column;
        }
        this.columnsManager.setActiveColumns(newActiveColumns);
    }

    autoSizeActiveColumnWidths(widenOnly: boolean) {
        this.columnsManager.autoSizeActiveColumnWidths(widenOnly);
    }

    setActiveColumnsAutoWidthSizing(widenOnly: boolean) {
        this.columnsManager.setActiveColumnsAutoWidthSizing(widenOnly);
    }

    autoSizeFieldColumnWidth(fieldNameOrIndex: string | number, widenOnly: boolean) {
        const fieldColumns = this.columnsManager.fieldColumns;
        let column: RevColumn<BCS, SF>;
        if (typeof fieldNameOrIndex === 'number') {
            column = fieldColumns[fieldNameOrIndex];
        } else {
            const foundColumn = fieldColumns.find((aColumn) => aColumn.field.name === fieldNameOrIndex);
            if (foundColumn === undefined) {
                throw new RevApiError('RASFC29752', `RevColumnsManager.setActiveColumns: Column with name not found: ${fieldNameOrIndex}`);
            } else {
                column = foundColumn;
            }
        }
        column.autoSizeWidth(widenOnly);
    }

    setColumnScrollAnchor(index: Integer, offset: Integer) {
        return this.viewLayout.setColumnScrollAnchor(index, offset);
    }

    calculateActiveColumnsWidth() {
        const lineWidth = this.settings.verticalGridLinesWidth;
        const columnsManager = this.columnsManager;
        const activeColumnCount = columnsManager.activeColumnCount;
        const fixedColumnCount = this.columnsManager.getFixedColumnCount();

        let width = 0;
        for (let i = 0; i < activeColumnCount; i++) {
            width += columnsManager.getActiveColumnWidth(i);

            if (i > 0) {
                if (i === fixedColumnCount && i !== 0) {
                    const fixedLineWidth = this.settings.verticalFixedLineWidth ?? lineWidth;
                    width += fixedLineWidth;
                } else {
                    width += lineWidth;
                }
            }
        }

        return width;
    }

    calculateActiveNonFixedColumnsWidth() {
        const gridLinesVWidth = this.settings.verticalGridLinesWidth;
        const columnCount = this.activeColumnCount;
        const fixedColumnCount = this.columnsManager.getFixedColumnCount();
        let result = 0;
        for (let i = fixedColumnCount; i < columnCount; i++) {
            result += this.getActiveColumnWidth(i);
        }

        if (gridLinesVWidth > 0) {
            const scrollableColumnCount = columnCount - fixedColumnCount;
            if (scrollableColumnCount > 1) {
                result += (scrollableColumnCount - 1) * gridLinesVWidth;
            }
        }

        return result;
    }

    getActiveColumn(activeIndex: Integer) {
        return this.columnsManager.getActiveColumn(activeIndex);
    }

    getActiveColumnIndexByFieldIndex(fieldIndex: Integer) {
        return this.columnsManager.getActiveColumnIndexByFieldIndex(fieldIndex);
    }

    /**
     * @returns The width of the given column.
     * @param activeIndex - The untranslated column index.
     */
    getActiveColumnWidth(activeIndex: Integer) {
        return this.columnsManager.getActiveColumnWidth(activeIndex);
    }

    /**
     * Set the width of the given column.
     * @param columnOrIndex - Column or index of active column whose width is to be set.
     * @param width - The width in pixels.
     * @param ui - Whether this was instigated by a UI action
     * @returns true if column width was changed
     */
    setActiveColumnWidth(columnOrIndex: Integer | RevColumn<BCS, SF>, width: Integer, ui: boolean) {
        let column: RevColumn<BCS, SF>
        if (typeof columnOrIndex === 'number') {
            if (columnOrIndex >= 0) {
                column = this.columnsManager.getActiveColumn(columnOrIndex);
            } else {
                throw new RevApiError('RSACW93109', `Behavior.setColumnWidth: Invalid column number ${columnOrIndex}`);
            }
        } else {
            column = columnOrIndex;
        }

        return column.setWidth(width, ui);
    }

    setColumnWidths(columnWidths: RevColumnAutoSizeableWidth<BCS, SF>[]) {
        return this.columnsManager.setColumnWidths(columnWidths, false);
    }

    setColumnWidthsByName(columnNameWidths: RevColumnsManager.FieldNameAndAutoSizableWidth[]) {
        return this.columnsManager.setColumnWidthsByFieldName(columnNameWidths, false);
    }

    /**
     * @returns The height of the given row
     * @param rowIndex - The untranslated fixed column index.
     */
    getRowHeight(rowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>) {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        return subgrid.getRowHeight(rowIndex);
    }

    /**
     * Set the height of the given row.
     * @param rowIndex - The row index.
     * @param rowHeight - The width in pixels.
     */
    setRowHeight(rowIndex: Integer, rowHeight: Integer, subgrid?: RevSubgrid<BCS, SF>) {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        this._rowPropertiesBehavior.setRowHeight(rowIndex, rowHeight, subgrid);
    }

    /**
     * The top left area has been clicked on
     * @remarks Delegates to the behavior.
     * @param {event} mouse - The event details.
     */
    // topLeftClicked(mouse) {
    //     this.behavior.topLeftClicked(this, mouse); // not implemented
    // }

    /**
     * A fixed row has been clicked.
     * @remarks Delegates to the behavior.
     * @param {event} event - The event details.
     */
    // rowHeaderClicked(mouse) {
    //     this.behavior.rowHeaderClicked(this, mouse); // not implemented
    // }

    /**
     * A fixed column has been clicked.
     * @remarks Delegates to the behavior.
     * @param {event} event - The event details.
     */
    // columnHeaderClicked(mouse) {
    //     this.behavior.columnHeaderClicked(this, mouse); // not implemented
    // }

    /**
     * @returns The HiDPI ratio.
     */
    getHiDPI(): number {
        return this.canvas.devicePixelRatio;
    }

    /**
     * @returns The width of the given (recently rendered) column.
     * @param colIndex - The column index.
     */
    getRenderedWidth(colIndex: Integer): Integer {
        return this.viewLayout.getRenderedWidth(colIndex);
    }

    /**
     * @returns The height of the given (recently rendered) row.
     * @param rowIndex - The row index.
     */
    getRenderedHeight(rowIndex: Integer): Integer {
        return this.viewLayout.getRenderedHeight(rowIndex);
    }

    /**
     * @returns Objects with the values that were just rendered.
     */
    getRenderedData(): RevDataServer.ViewValue[][] {
        return this.viewLayout.getVisibleCellMatrix();
    }

    /**
     * Reset zoom factor used by mouse tracking and placement
     * of cell editors on top of canvas.
     *
     * Call this after resetting `document.body.style.zoom`.
     * (Do not set `zoom` style on canvas or any other ancestor thereof.)
     *
     * **NOTE THE FOLLOWING:**
     * 1. `zoom` is non-standard (unsupported by FireFox)
     * 2. The alternative suggested on MDN, `transform`, is ignored
     * here as it is not a practical replacement for `zoom`.
     * @see https://developer.mozilla.org/en-US/docs/Web/CSS/zoom
     *
     * @todo Scrollbars need to be repositioned when `canvas.style.zoom` !== 1. (May need update to finbars.)
     */
    // resetZoom() {
    //     this.abortEditing();
    //     this.canvas.resetZoom();
    // }

    // getBodyZoomFactor() {
    //     return this.canvas.bodyZoomFactor;
    // }

    /**
     * Enable/disable if this component can receive the focus.
     */
    // setFocusable(canReceiveFocus: boolean) {
    //     this.canvas.setFocusable(canReceiveFocus);
    // }

    /**
     * @returns The number of columns that were just rendered
     */
    getVisibleColumnsCount() {
        return this.viewLayout.getColumnsCount();
    }

    /**
     * @returns The number of rows that were just rendered
     */
    getVisibleRowsCount() {
        return this.viewLayout.getRowsCount();
    }

    swapColumns(source: Integer, target: Integer) {
        //Turns out this is called during dragged 'i.e' when the floater column is reshuffled
        //by the currently dragged column. The column positions are constantly reshuffled
        this.columnsManager.swapColumns(source, target);
    }

    /**
     * @param activeColumnIndex - Data x coordinate.
     * @returns The properties for a specific column.
     */
    getActiveColumnSettings(activeColumnIndex: Integer): BCS {
        const column = this.columnsManager.getActiveColumn(activeColumnIndex);
        return column.settings;
    }

    mergeFieldColumnSettings(fieldIndex: Integer, settings: Partial<BCS>, overrideGrid = false) {
        return this.columnsManager.mergeFieldColumnSettings(fieldIndex, settings, overrideGrid);
    }

    setFieldColumnSettings(fieldIndex: Integer, settings: BCS) {
        return this.columnsManager.mergeFieldColumnSettings(fieldIndex, settings, true);
    }

    /**
     * Clears all cell properties of given column or of all columns.
     * @param x - Omit for all columns.
     * @internal
     */
    clearAllCellProperties(x?: Integer) {
        const column = x === undefined ? undefined : this.columnsManager.getFieldColumn(x);
        this._cellPropertiesBehavior.clearAllCellProperties(column)
    }

    addEventListener(eventName: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        this.canvas.addExternalEventListener(eventName, listener, options);
    }

    removeEventListener(eventName: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
        this.canvas.removeExternalEventListener(eventName, listener, options);
    }

    // Focus
    clearFocus(): void {
        this.focus.clear();
    }

    // RevFocusScrollBehavior

    tryFocusColumnRowAndEnsureInView(activeColumnIndex: Integer, subgridRowIndex: Integer, subgrid = this.mainSubgrid, cell?: RevViewCell<BCS, SF>): boolean {
        return this._focusScrollBehavior.tryFocusColumnRowAndEnsureInView(activeColumnIndex, subgridRowIndex, subgrid, cell);
    }

    tryFocusXAndEnsureInView(activeColumnIndex: Integer): boolean {
        return this._focusScrollBehavior.tryFocusColumnAndEnsureInView(activeColumnIndex);
    }

    tryFocusSubgridRowAndEnsureInView(subgridRowIndex: Integer, subgrid = this.mainSubgrid): boolean {
        return this._focusScrollBehavior.tryFocusSubgridRowAndEnsureInView(subgridRowIndex, subgrid);
    }

    tryMoveFocusLeft(): boolean {
        return this._focusScrollBehavior.tryMoveFocusLeft();
    }

    tryMoveFocusRight(): boolean {
        return this._focusScrollBehavior.tryMoveFocusRight();
    }

    tryMoveFocusUp(): boolean {
        return this._focusScrollBehavior.tryMoveFocusUp();
    }

    tryMoveFocusDown(): boolean {
        return this._focusScrollBehavior.tryMoveFocusDown();
    }

    tryFocusFirstColumn(): boolean {
        return this._focusScrollBehavior.tryFocusFirstColumn();
    }

    tryFocusLastColumn(): boolean {
        return this._focusScrollBehavior.tryFocusLastColumn();
    }

    tryFocusTop(): boolean {
        return this._focusScrollBehavior.tryFocusTop();
    }

    tryFocusBottom(): boolean {
        return this._focusScrollBehavior.tryFocusBottom();
    }

    tryPageFocusLeft(): boolean {
        return this._focusScrollBehavior.tryPageFocusLeft();
    }

    tryPageFocusRight(): boolean {
        return this._focusScrollBehavior.tryPageFocusRight();
    }

    tryPageFocusUp(): boolean {
        return this._focusScrollBehavior.tryPageFocusUp();
    }

    tryPageFocusDown(): boolean {
        return this._focusScrollBehavior.tryPageFocusDown();
    }

    tryScrollLeft(): boolean {
        return this._focusScrollBehavior.tryScrollLeft();
    }

    tryScrollRight(): boolean {
        return this._focusScrollBehavior.tryScrollRight();
    }

    tryScrollUp(): boolean {
        return this._focusScrollBehavior.tryScrollUp();
    }

    tryScrollDown(): boolean {
        return this._focusScrollBehavior.tryScrollDown();
    }

    scrollFirstColumn(): boolean {
        return this._focusScrollBehavior.scrollFirstColumn();
    }

    scrollLastColumn(): boolean {
        return this._focusScrollBehavior.scrollLastColumn();
    }

    scrollTop(): boolean {
        return this._focusScrollBehavior.scrollTop();
    }

    scrollBottom(): boolean {
        return this._focusScrollBehavior.scrollBottom();
    }

    tryScrollPageLeft(): boolean {
        return this._focusScrollBehavior.tryScrollPageLeft();
    }

    tryScrollPageRight(): boolean {
        return this._focusScrollBehavior.tryScrollPageRight();
    }

    tryScrollPageUp(): boolean {
        return this._focusScrollBehavior.tryScrollPageUp();
    }

    tryScrollPageDown(): boolean {
        return this._focusScrollBehavior.tryScrollPageDown();
    }

    /**
     * Get the cell's own properties object.
     * @remarks May be undefined because cells only have their own properties object when at lest one own property has been set.
     * @param allXOrRenderedCell - Data x coordinate or cell event.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @returns The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `undefined`.
     * @internal
     */
    getCellOwnProperties(allXOrRenderedCell: Integer | RevViewCell<BCS, SF>, y?: Integer, subgrid?: RevSubgrid<BCS, SF>) {
        if (typeof allXOrRenderedCell === 'object') {
            // xOrCellEvent is cellEvent
            const column = allXOrRenderedCell.viewLayoutColumn.column;
            y = allXOrRenderedCell.viewLayoutRow.subgridRowIndex;
            subgrid = allXOrRenderedCell.subgrid;
            return this._cellPropertiesBehavior.getCellOwnProperties(column, y, subgrid);
        } else {
            // xOrCellEvent is x
            if (y !== undefined && subgrid !== undefined) {
                const column = this.columnsManager.getFieldColumn(allXOrRenderedCell);
                return this._cellPropertiesBehavior.getCellOwnProperties(column, y, subgrid);
            } else {
                return undefined;
            }
        }
    }

    /**
     * Get the properties object for cell.
     * @remarks This is the cell's own properties object if found else the column object.
     *
     * If you are seeking a single specific property, consider calling {@link RevBehaviorManager#getCellProperty} instead.
     * @param xOrCellEvent - Data x coordinate or CellEvent.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @returns The properties of the cell at x,y in the grid or falsy if not available.
     * @internal
     */
    getCellOwnPropertiesFromRenderedCell(renderedCell: RevViewCell<BCS, SF>): RevMetaServer.CellOwnProperties | false | null | undefined{
        return this._cellPropertiesBehavior.getCellOwnPropertiesFromViewCell(renderedCell);
    }

    /** @internal */
    getCellProperties(allX: Integer, subgridRowIndex: Integer, subgrid: RevSubgrid<BCS, SF>): RevCellMetaSettings {
        const column = this.columnsManager.getFieldColumn(allX);
        return this._cellPropertiesBehavior.getCellPropertiesAccessor(column, subgridRowIndex, subgrid);
    }

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    getCellOwnPropertyFromRenderedCell(renderedCell: RevViewCell<BCS, SF>, key: string): RevMetaServer.CellOwnProperty | undefined {
        return this._cellPropertiesBehavior.getCellOwnPropertyFromViewCell(renderedCell, key);
    }

    /**
     * Return a specific cell property.
     * @remarks If there is no cell properties object, defers to column properties object.
     * @param allX - Data x coordinate.
     * @param subgridRowIndex - Subgrid row coordinate.
     * @param key - Name of property to get.
     * @param subgrid - Subgrid in which contains cell
     * @returns The specified property for the cell at x,y in the grid.
     * @internal
     */
    getCellProperty(allX: Integer, subgridRowIndex: Integer, key: string | number, subgrid: RevSubgrid<BCS, SF>): RevMetaServer.CellOwnProperty;
    /** @internal */
    getCellProperty<T extends keyof RevColumnSettings>(allX: Integer, subgridRowIndex: Integer, key: T, subgrid: RevSubgrid<BCS, SF>): RevColumnSettings[T];
    /** @internal */
    getCellProperty<T extends keyof RevColumnSettings>(
        allX: Integer,
        subgridRowIndex: Integer,
        key: string | T,
        subgrid: RevSubgrid<BCS, SF>
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    ): RevMetaServer.CellOwnProperty | RevColumnSettings[T] {
        const column = this.columnsManager.getFieldColumn(allX);
        return this._cellPropertiesBehavior.getCellProperty(column, subgridRowIndex, key, subgrid);
    }

    /**
     * update the data at point x, y with value
     * @param xOrCellEvent - Data x coordinate.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param properties - Hash of cell properties. _When `y` omitted, this param promoted to 2nd arg._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @internal
     */
    setCellOwnPropertiesUsingCellEvent(cell: RevViewCell<BCS, SF>, properties: RevMetaServer.CellOwnProperties) {
        const column = cell.viewLayoutColumn.column;
        this._cellPropertiesBehavior.setCellOwnProperties(column, cell.viewLayoutRow.subgridRowIndex, properties, cell.subgrid);
    }
    /** @internal */
    setCellOwnProperties(allX: Integer, subgridRowIndex: Integer, properties: RevMetaServer.CellOwnProperties, subgrid: RevSubgrid<BCS, SF>) {
        const column = this.columnsManager.getFieldColumn(allX);
        this._cellPropertiesBehavior.setCellOwnProperties(column, subgridRowIndex, properties, subgrid);
    }

    /**
     * update the data at point x, y with value
     * @param xOrCellEvent - Data x coordinate.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param properties - Hash of cell properties. _When `y` omitted, this param promoted to 2nd arg._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @internal
     */
    addCellOwnPropertiesUsingCellEvent(cell: RevViewCell<BCS, SF>, properties: RevMetaServer.CellOwnProperties) {
        const column = cell.viewLayoutColumn.column;
        this._cellPropertiesBehavior.addCellOwnProperties(column, cell.viewLayoutRow.subgridRowIndex, properties, cell.subgrid);
    }
    /** @internal */
    addCellOwnProperties(allX: Integer, subgridRowIndex: Integer, properties: RevMetaServer.CellOwnProperties, subgrid: RevSubgrid<BCS, SF>) {
        const column = this.columnsManager.getFieldColumn(allX);
        this._cellPropertiesBehavior.addCellOwnProperties(column, subgridRowIndex, properties, subgrid);
    }

    /**
     * Set a specific cell property.
     * @remarks If there is no cell properties object, defers to column properties object.
     *
     * NOTE: For performance reasons, renderer's cell event objects cache their respective cell properties objects. This method accepts a `CellEvent` overload. Whenever possible, use the `CellEvent` from the renderer's cell event pool. Doing so will reset the cell properties object cache.
     *
     * If you use some other `CellEvent`, the renderer's `CellEvent` properties cache will not be automatically reset until the whole cell event pool is reset on the next call to {@link RevViewLayout#computeCellBoundaries}. If necessary, you can "manually" reset it by calling {@link RevViewLayout#resetCellPropertiesCache|resetCellPropertiesCache(yourCellEvent)} which searches the cell event pool for one with matching coordinates and resets the cache.
     *
     * The raw coordinates overload calls the `resetCellPropertiesCache(x, y)` overload for you.
     * @param xOrCellEvent - `CellEvent` or data x coordinate.
     * @param y - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param key - Name of property to get. _When `y` omitted, this param promoted to 2nd arg._
     * @param subgrid - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @internal
     */
    setCellProperty(cell: RevViewCell<BCS, SF>, key: string, value: RevMetaServer.CellOwnProperty): RevMetaServer.CellOwnProperties | undefined;
    /** @internal */
    setCellProperty(allX: Integer, dataY: Integer, key: string, value: RevMetaServer.CellOwnProperty, subgrid: RevSubgrid<BCS, SF>): RevMetaServer.CellOwnProperties | undefined;
    /** @internal */
    setCellProperty(
        allXOrCell: RevViewCell<BCS, SF> | number,
        yOrKey: string | number,
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        keyOrValue: string | RevMetaServer.CellOwnProperty,
        value?: RevMetaServer.CellOwnProperty,
        subgrid?: RevSubgrid<BCS, SF>
    ): RevMetaServer.CellOwnProperties | undefined {
        let optionalCell: RevViewCell<BCS, SF> | undefined;
        let column: RevColumn<BCS, SF>;
        let dataY: Integer;
        let key: string;
        if (typeof allXOrCell === 'object') {
            optionalCell = allXOrCell;
            column = allXOrCell.viewLayoutColumn.column;
            dataY = allXOrCell.viewLayoutRow.subgridRowIndex;
            key = yOrKey as string;
            value = keyOrValue;
        } else {
            optionalCell = undefined;
            column = this.columnsManager.getFieldColumn(allXOrCell);
            dataY = yOrKey as number;
            key = keyOrValue as string;
        }

        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }

        return this._cellPropertiesBehavior.setCellProperty(column, dataY, key, value, subgrid, optionalCell);
    }

    // RevSelection

    /** Call before multiple selection changes to consolidate SelectionChange events.
     * Pair with endSelectionChange().
     */
    beginSelectionChange(): void {
        this.selection.beginChange();
    }

    /** Call after multiple selection changes to consolidate SelectionChange events.
     * Pair with beginSelectionChange().
     */
    endSelectionChange(): void {
        this.selection.endChange();
    }

    clearSelection(): void {
        this.selection.clear();
    }

    selectDynamicAll(subgrid: RevSubgrid<BCS, SF> | undefined): RevLastSelectionArea<BCS, SF> | undefined {
        return this.selection.selectDynamicAll(subgrid);
    }

    deselectDynamicAll(subgrid: RevSubgrid<BCS, SF> | undefined): boolean {
        return this.selection.deselectDynamicAll(subgrid);
    }

    selectCell(activeColumnIndex: Integer, subgridRowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>): RevLastSelectionArea<BCS, SF> {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        return this.selection.selectCell(activeColumnIndex, subgridRowIndex, subgrid);
    }

    deleteCellSelectionArea(activeColumnIndex: Integer, subgridRowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>): void {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        this.selection.deleteCellArea(activeColumnIndex, subgridRowIndex, subgrid);
    }

    toggleSelectCell(activeColumnIndex: Integer, subgridRowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>): boolean {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        return this.selection.toggleSelectCell(activeColumnIndex, subgridRowIndex, subgrid);
    }

    onlySelectRectangle(leftOrExRightActiveColumnIndex: Integer, topOrExBottomSubgridRowIndex: Integer, width: Integer, height: Integer, subgrid?: RevSubgrid<BCS, SF>): RevLastSelectionArea<BCS, SF> {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        return this.selection.onlySelectRectangle(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid);
    }

    selectRectangle(leftOrExRightActiveColumnIndex: Integer, topOrExBottomSubgridRowIndex: Integer, width: Integer, height: Integer, subgrid?: RevSubgrid<BCS, SF>): RevLastSelectionArea<BCS, SF> {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        return this.selection.selectRectangle(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid);
    }

    deleteRectangleSelectionArea(rectangle: RevRectangle, subgrid = this.mainSubgrid): void {
        this.selection.deleteRectangleArea(rectangle, subgrid);
    }

    deselectRow(subgridRowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>): void {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        this.selection.deselectRows(subgridRowIndex, 1, subgrid);
    }

    deselectRows(subgridRowIndex: Integer, count: Integer, subgrid?: RevSubgrid<BCS, SF>): void {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        this.selection.deselectRows(subgridRowIndex, count, subgrid);
    }

    /**
     * Removes a columns from the selection.
     *
     * The list of column selection areas will be updated to reflect the necessary deletion, splitting or resizing required.
     *
     * @param activeColumnIndex - The index of the active column to remove.
     */
    deselectColumn(activeColumnIndex: Integer): void {
        this.selection.deselectColumns(activeColumnIndex, 1);
    }

    /**
     * Removes a range of columns from the selection.
     *
     * The list of column selection areas will be updated to reflect the necessary deletion, splitting or resizing required.
     *
     * @param leftOrExRightActiveColumnIndex - The start index of the range of active columns to deselect if `count` is positive, or the exclusive end index if `count` is negative.
     * @param count - The number of columns to deselect. If negative, `count` is in reverse direction from the exclusive end index.
     */
    deselectColumns(leftOrExRightActiveColumnIndex: Integer, count: Integer): void {
        this.selection.deselectColumns(leftOrExRightActiveColumnIndex, count);
    }

    isCellSelected(activeColumnIndex: Integer, subgridRowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>): boolean {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        return this.selection.isCellSelected(activeColumnIndex, subgridRowIndex, subgrid);
    }

    /** Returns undefined if not selected, false if selected with others, true if the only cell selected */
    isOnlyThisCellSelected(activeColumnIndex: Integer, subgridRowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>): boolean | undefined {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        return this.selection.isOnlyThisCellSelected(activeColumnIndex, subgridRowIndex, subgrid);
    }

    getOneCellSelectionAreaType(activeColumnIndex: Integer, subgridRowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>): RevSelectionAreaType | undefined {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        const typeId = this.selection.getOneCellSelectionAreaTypeId(activeColumnIndex, subgridRowIndex, subgrid);

        if (typeId === undefined) {
            return undefined;
        } else {
            return RevSelectionAreaType.fromId(typeId);
        }
    }

    getAllCellSelectionAreaTypeIds(activeColumnIndex: Integer, subgridRowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>): RevSelectionAreaType[] {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        const typeIds = this.selection.getAllCellSelectionAreaTypeIds(activeColumnIndex, subgridRowIndex, subgrid);
        return RevSelectionAreaType.arrayFromIds(typeIds);
    }

    isSelectedCellTheOnlySelectedCell(
        activeColumnIndex: Integer,
        subgridRowIndex: Integer,
        subgrid: RevSubgrid<BCS, SF>,
        selectedType: RevSelectionAreaType = 'rectangle',
    ): boolean {
        const selectedTypeId = RevSelectionAreaType.toId(selectedType);
        return this.selection.isSelectedCellTheOnlySelectedCell(activeColumnIndex, subgridRowIndex, subgrid, selectedTypeId)
    }

    areColumnsOrRowsSelected(includeDynamicAllIfSelectedActive = true): boolean {
        return this.selection.hasColumnsOrRows(includeDynamicAllIfSelectedActive);
    }

    areRowsSelected(subgrid = this.mainSubgrid, includeDynamicAllIfSelected = true): boolean {
        return this.selection.hasRows(subgrid, includeDynamicAllIfSelected);
    }

    getSelectedRowCount(subgrid = this.mainSubgrid, includeDynamicAllIfSelected = true): number {
        return this.selection.getRowCount(subgrid, includeDynamicAllIfSelected);
    }

    getSelectedAllAreaRowCount(): number {
        return this.selection.getDynamicAllRowCount();
    }

    getSelectedRowIndices(includeDynamicAllIfSelected = true): RevSelectionRows.SubgridIndices<BCS, SF>[] {
        return this.selection.getRowIndices(includeDynamicAllIfSelected);
    }

    getSelectedDynamicAllRowIndices(): RevSelectionRows.SubgridIndices<BCS, SF>[] {
        return this.selection.getDynamicAllRowIndices();
    }

    getSelectedSubgridDynamicAllRowIndices(subgrid = this.mainSubgrid): Integer[] {
        return this.selection.getSubgridDynamicAllRowIndices(subgrid);
    }

    areColumnsSelected(includeDynamicAllIfSelected = true): boolean {
        return this.selection.hasColumns(includeDynamicAllIfSelected);
    }

    getSelectedColumnIndices(includeDynamicAllIfSelected = true): number[] {
        return this.selection.getColumnIndices(includeDynamicAllIfSelected);
    }

    // RevFocusSelectBehavior

    selectColumn(activeColumnIndex: Integer): void {
        this._focusSelectBehavior.selectColumn(activeColumnIndex);
    }

    selectColumns(activeColumnIndex: Integer, count: Integer): void {
        this._focusSelectBehavior.selectColumns(activeColumnIndex, count);
    }

    onlySelectColumn(activeColumnIndex: Integer): void {
        this._focusSelectBehavior.onlySelectColumn(activeColumnIndex);
    }

    onlySelectColumns(activeColumnIndex: Integer, count: Integer): void {
        this._focusSelectBehavior.onlySelectColumns(activeColumnIndex, count);
    }

    toggleSelectColumn(activeColumnIndex: Integer): void {
        this._focusSelectBehavior.toggleSelectColumn(activeColumnIndex);
    }

    selectRow(subgridRowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>): void {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        this._focusSelectBehavior.selectRow(subgridRowIndex, subgrid);
    }

    selectRows(subgridRowIndex: Integer, count: Integer, subgrid?: RevSubgrid<BCS, SF>): void {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        this._focusSelectBehavior.selectRows(subgridRowIndex, count, subgrid);
    }

    selectAllRows(subgrid?: RevSubgrid<BCS, SF>): void {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        this._focusSelectBehavior.selectAllRows(subgrid);
    }

    onlySelectRow(subgridRowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>): void {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        this._focusSelectBehavior.onlySelectRow(subgridRowIndex, subgrid);
    }

    onlySelectRows(subgridRowIndex: Integer, count: Integer, subgrid?: RevSubgrid<BCS, SF>): void {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        this._focusSelectBehavior.onlySelectRows(subgridRowIndex, count, subgrid);
    }

    toggleSelectRow(subgridRowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>): void {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        this._focusSelectBehavior.toggleSelectRow(subgridRowIndex, subgrid);
    }

    focusOnlySelectRectangle(
        leftOrExRightActiveColumnIndex: Integer,
        topOrExBottomSubgridRowIndex: Integer,
        width: Integer,
        height: Integer,
        subgrid?: RevSubgrid<BCS, SF>,
        ensureFullyInView = RevEnsureFullyInViewEnum.Never
    ): void {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        this._focusSelectBehavior.focusOnlySelectRectangle(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid, ensureFullyInView);
    }

    focusOnlySelectCell(activeColumnIndex: Integer, subgridRowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>, ensureFullyInView = RevEnsureFullyInViewEnum.Never): void {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        this._focusSelectBehavior.focusOnlySelectCell(activeColumnIndex, subgridRowIndex, subgrid, ensureFullyInView);
    }

    onlySelectViewCell(viewLayoutColumnIndex: Integer, viewLayoutRowIndex: Integer): void {
        this._focusSelectBehavior.onlySelectViewCell(viewLayoutColumnIndex, viewLayoutRowIndex);
    }

    focusSelectCell(activeColumnIndex: Integer, subgridRowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>, ensureFullyInView = RevEnsureFullyInViewEnum.Never): void {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        this._focusSelectBehavior.focusSelectCell(activeColumnIndex, subgridRowIndex, subgrid, ensureFullyInView);
    }

    focusToggleSelectCell(activeColumnIndex: Integer, subgridRowIndex: Integer, subgrid?: RevSubgrid<BCS, SF>, ensureFullyInView = RevEnsureFullyInViewEnum.Never): boolean {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        return this._focusSelectBehavior.focusToggleSelectCell(activeColumnIndex, subgridRowIndex, subgrid, ensureFullyInView);
    }

    tryOnlySelectFocusedCell(): boolean {
        return this._focusSelectBehavior.tryOnlySelectFocusedCell();
    }

    focusReplaceLastArea(
        areaType: RevSelectionAreaType,
        leftOrExRightActiveColumnIndex: Integer,
        topOrExBottomSubgridRowIndex: Integer,
        width: Integer,
        height: Integer,
        subgrid?: RevSubgrid<BCS, SF>,
        ensureFullyInView = RevEnsureFullyInViewEnum.Never,
    ): void {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        const areaTypeId = RevSelectionAreaType.toId(areaType);
        this._focusSelectBehavior.focusReplaceLastArea(areaTypeId, leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid, ensureFullyInView);
    }

    focusReplaceLastAreaWithRectangle(
        leftOrExRightActiveColumnIndex: Integer,
        topOrExBottomSubgridRowIndex: Integer,
        width: Integer,
        height: Integer,
        subgrid?: RevSubgrid<BCS, SF>,
        ensureFullyInView = RevEnsureFullyInViewEnum.Never,
    ): void {
        if (subgrid === undefined) {
            subgrid = this.mainSubgrid;
        }
        this._focusSelectBehavior.focusReplaceLastAreaWithRectangle(leftOrExRightActiveColumnIndex, topOrExBottomSubgridRowIndex, width, height, subgrid, ensureFullyInView);
    }

    tryExtendLastSelectionAreaAsCloseAsPossibleToFocus() {
        return this._focusSelectBehavior.tryExtendLastSelectionAreaAsCloseAsPossibleToFocus();
    }

    // Overridable methods for descendant classes to handle event processing

    protected descendantProcessDataServersRowListChanged(_dataServers: RevDataServer<SF>[]) {
        // for descendants
    }

    protected descendantProcessCellFocusChanged(_newPoint: RevPoint | undefined, _oldPoint: RevPoint | undefined) {
        // for descendants
    }

    protected descendantProcessRowFocusChanged(_newSubgridRowIndex: Integer | undefined, _oldSubgridRowIndex: Integer | undefined) {
        // for descendants
    }

    protected descendantProcessSelectionChanged() {
        // for descendants
    }

    protected descendantProcessFieldColumnListChanged(_typeId: RevListChangedTypeId, _index: Integer, _count: Integer, _targetIndex: Integer | undefined) {
        // for descendants
    }

    protected descendantProcessActiveColumnListChanged(_typeId: RevListChangedTypeId, _index: Integer, _count: Integer, _targetIndex: Integer | undefined, _ui: boolean) {
        // for descendants
    }

    protected descendantProcessColumnsWidthChanged(_columns: RevColumn<BCS, SF>[], _ui: boolean) {
        // for descendants
    }

    protected descendantProcessColumnsViewWidthsChanged(_changeds: RevViewLayout.ColumnsViewWidthChangeds) {
        // for descendants
    }

    protected descendantProcessColumnSort(_event: MouseEvent, _headerOrFixedRowCell: RevViewCell<BCS, SF>) {
        // for descendants
    }

    protected descendantEventerFocus() {
        // for descendants
    }

    protected descendantEventerBlur() {
        // for descendants
    }

    protected descendantProcessKeyDown(_event: KeyboardEvent, _fromEditor: boolean) {
        // for descendants
    }

    protected descendantProcessKeyUp(_event: KeyboardEvent) {
        // for descendants
    }

    protected descendantProcessClick(_event: MouseEvent, _hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    protected descendantProcessDblClick(_event: MouseEvent, _hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    protected descendantProcessPointerEnter(_event: MouseEvent, _hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    protected descendantProcessPointerDown(_event: MouseEvent, _hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    protected descendantProcessPointerUpCancel(_event: MouseEvent, _hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    protected descendantProcessPointerMove(_event: MouseEvent, _hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    protected descendantProcessPointerLeaveOut(_event: MouseEvent, _hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    protected descendantProcessWheelMove(_event: MouseEvent, _hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    protected descendantProcessDragStart(_event: DragEvent) {
        // for descendants
    }

    protected descendantProcessContextMenu(_event: MouseEvent, _hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined) {
        // for descendants
    }

    /**
     * Uses DragEvent as this has original Mouse location.  Do not change DragEvent or call any of its methods
     * Return true if drag operation is to be started.
     */
    protected descendantProcessPointerDragStart(_event: DragEvent, _hoverCell: RevLinedHoverCell<BCS, SF> | null | undefined): boolean {
        return false;
    }

    protected descendantProcessPointerDrag(_event: PointerEvent) {
        // for descendants
    }

    protected descendantProcessPointerDragEnd(_event: PointerEvent) {
        // for descendants
    }

    protected descendantProcessRendered() {
        // for descendants
    }

    protected descendantProcessMouseEnteredCell(_cell: RevViewCell<BCS, SF>) {
        // for descendants
    }

    protected descendantProcessMouseExitedCell(_cell: RevViewCell<BCS, SF>) {
        // for descendants
    }

    protected descendantProcessTouchStart(_event: TouchEvent) {
        // for descendants
    }

    protected descendantProcessTouchMove(_event: TouchEvent) {
        // for descendants
    }

    protected descendantProcessTouchEnd(_event: TouchEvent) {
        // for descendants
    }

    protected descendantProcessCopy(_event: ClipboardEvent) {
        // for descendants
    }

    protected descendantProcessResized() {
        // for descendants
    }

    protected descendantProcessHorizontalScrollViewportStartChanged() {
        // for descendants
    }

    protected descendantProcessVerticalScrollViewportStartChanged() {
        // for descendants
    }

    protected descendantProcessHorizontalScrollerAction(_event: RevScroller.Action) {
        // for descendants
    }

    protected descendantProcessVerticalScrollerAction(_event: RevScroller.Action) {
        // for descendants
    }

    /** @internal */
    private prepareHost(hostElement: string | HTMLElement | undefined): HTMLElement {
        let resolvedHostElement: HTMLElement;
        if (hostElement === undefined) {
            let foundOrCreatedElement = document.getElementById(RevCssTypes.libraryName);

            if (foundOrCreatedElement === null || foundOrCreatedElement.childElementCount > 0) {
                // is not found or being used.  Create a new host
                foundOrCreatedElement = document.createElement('div');
                foundOrCreatedElement.style.display = RevCssTypes.Display.inline; // other display values would probably also work
                foundOrCreatedElement.style.position = RevCssTypes.Position.relative; // allow scrollers to be positioned
                foundOrCreatedElement.style.margin = '0'; // size of canvas must match host
                foundOrCreatedElement.style.padding = '0'; // size of canvas must match host
                foundOrCreatedElement.style.height = '100%'; // take up all space
                foundOrCreatedElement.style.width = '100%'; // take up all space
                document.body.appendChild(foundOrCreatedElement);
            }
            resolvedHostElement = foundOrCreatedElement;
        } else {
            if (typeof hostElement === 'string') {
                const queriedHostElement = document.querySelector(hostElement);
                if (queriedHostElement === null) {
                    throw new RevAssertError('RIC55998', `Host element not found: ${hostElement}`);
                } else {
                    resolvedHostElement = queriedHostElement as HTMLElement;
                }
            } else {
                resolvedHostElement = hostElement;
            }
        }

        return resolvedHostElement;
    }

    /** @internal */
    private createDescendantEventer(): RevEventBehavior.DescendantEventer<BCS, SF> {
        return {
            dataServersRowListChanged: (dataServers) => { this.descendantProcessDataServersRowListChanged(dataServers); },
            fieldColumnListChanged: (typeId, index, count, targetIndex) => { this.descendantProcessFieldColumnListChanged(typeId, index, count, targetIndex); },
            activeColumnListChanged: (typeId, index, count, targetIndex, ui) => { this.descendantProcessActiveColumnListChanged(typeId, index, count, targetIndex, ui); },
            columnsWidthChanged: (columns, ui) => { this.descendantProcessColumnsWidthChanged(columns, ui); },
            columnsViewWidthsChanged: (changeds) => { this.descendantProcessColumnsViewWidthsChanged(changeds); },
            columnSort: (event, headerOrFixedRowCell) => { this.descendantProcessColumnSort(event, headerOrFixedRowCell); },
            cellFocusChanged: (newPoint, oldPoint) => { this.descendantProcessCellFocusChanged(newPoint, oldPoint); },
            rowFocusChanged: (newSubgridRowIndex, oldSubgridRowIndex) => { this.descendantProcessRowFocusChanged(newSubgridRowIndex, oldSubgridRowIndex); },
            selectionChanged: () => { this.descendantProcessSelectionChanged(); },
            focus: () => { this.descendantEventerFocus(); },
            blur: () => { this.descendantEventerBlur(); },
            keyDown: (event, fromEditor) => { this.descendantProcessKeyDown(event, fromEditor); },
            keyUp: (event) => { this.descendantProcessKeyUp(event); },
            click: (event, cell) => { this.descendantProcessClick(event, cell); },
            dblClick: (event, cell) => { this.descendantProcessDblClick(event, cell); },
            pointerEnter: (event, cell) => { this.descendantProcessPointerEnter(event, cell); },
            pointerDown: (event, cell) => { this.descendantProcessPointerDown(event, cell); },
            pointerUpCancel: (event, cell) => { this.descendantProcessPointerUpCancel(event, cell); },
            pointerMove: (event, cell) => { this.descendantProcessPointerMove(event, cell); },
            pointerLeaveOut: (event, cell) => { this.descendantProcessPointerLeaveOut(event, cell); },
            wheelMove: (event, cell) => { this.descendantProcessWheelMove(event, cell); },
            dragStart: (event) => { this.descendantProcessDragStart(event); },
            contextMenu: (event, cell) => { this.descendantProcessContextMenu(event, cell); },
            pointerDragStart: (event, cell) => this.descendantProcessPointerDragStart(event, cell),
            pointerDrag: (event) => { this.descendantProcessPointerDrag(event); },
            pointerDragEnd: (event) => { this.descendantProcessPointerDragEnd(event); },
            rendered: () => { this.descendantProcessRendered(); },
            mouseEnteredCell: (cell) => { this.descendantProcessMouseEnteredCell(cell); },
            mouseExitedCell: (cell) => { this.descendantProcessMouseExitedCell(cell); },
            touchStart: (event) => { this.descendantProcessTouchStart(event); },
            touchMove: (event) => { this.descendantProcessTouchMove(event); },
            touchEnd: (event) => { this.descendantProcessTouchEnd(event); },
            copy: (event) => { this.descendantProcessCopy(event); },
            resized: () => { this.descendantProcessResized(); },
            horizontalScrollViewportStartChanged: () => { this.descendantProcessHorizontalScrollViewportStartChanged(); },
            verticalScrollViewportStartChanged: () => { this.descendantProcessVerticalScrollViewportStartChanged(); },
            horizontalScrollerAction: (action) => { this.descendantProcessHorizontalScrollerAction(action); },
            verticalScrollerAction: (action) => { this.descendantProcessVerticalScrollerAction(action); },
        }
    }
}

/** @public */
export namespace RevClientGrid {
    export type GetSettingsForNewColumnEventer<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> = RevColumnsManager.GetSettingsForNewColumnEventer<BCS, SF>;

    /** @internal */
    export const idGenerator = new RevIdGenerator();
}
