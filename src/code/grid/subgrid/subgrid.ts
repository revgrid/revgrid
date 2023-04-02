import { CellModel } from '../../grid/model/cell-model';
import { DataModel } from '../../grid/model/data-model';
import { MetaModel } from '../../grid/model/meta-model';
import { SchemaModel } from '../../grid/model/schema-model';
import { CellEditor } from '../cell-editor/cell-editor';
import { cellEditorFactory } from '../cell-editor/cell-editor-factory';
import { CellPainter } from '../cell-painter/cell-painter';
import { BeingPaintedCell } from '../cell/being-painted-cell';
import { CellEvent } from '../cell/cell-event';
import { Column } from '../column/column';
import { ColumnsManager } from '../column/columns-manager';
import { AssertError, UnreachableCaseError } from '../lib/revgrid-error';
import { CellPaintConfig } from '../renderer/cell-paint-config';
import { CellPaintConfigAccessor } from '../renderer/cell-paint-config-accessor';
import { Revgrid } from '../revgrid';
import { Selection } from '../subgrid/selection/selection';
import { SelectionStash } from '../subgrid/selection/selection-stash';
import { SelectionType } from '../subgrid/selection/selection-type';
import { Focus } from './focus';

/** @public */
export class Subgrid {
    readonly isMain: boolean = false;
    readonly isHeader: boolean = false;
    readonly isFilter: boolean = false;
    readonly isSummary: boolean = false;

    /** @internal */
    private _nestedStashSelectionsRequestCount = 0;
    /** @internal */
    private _selectionStash: SelectionStash | undefined;

    /** @internal */
    // readonly focusedCell: FocusedCell;
    /** @internal */
    readonly selection: Selection;
    private readonly focus: Focus;

    lastEdgeSelection: [x: number, y: number] = [0, 0]; // 1st element is x, 2nd element is y

    /** @internal */
    protected _destroyed = false;

    /** @internal */
    private rowProxy: Subgrid.DataRowProxy; // used if DataModel.getRowProperties not implemented
    /** @internal */
    private rowMetadata: (MetaModel.RowMetadata | undefined)[] = [];

    private _columnsManagerBeforeCreateColumnsListener = () => this.rowProxy.updateSchema();

    /** @internal */
    constructor(
        /** @internal */
        protected readonly _grid: Revgrid,
        /** @internal */
        protected readonly _columnsManager: ColumnsManager,
        /** @internal */
        public readonly role: Subgrid.Role,
        public readonly schemaModel: SchemaModel,
        public readonly dataModel: DataModel,
        public readonly metaModel: MetaModel | undefined,
        public readonly cellModel: CellModel | undefined,
    ) {
        switch (role) {
            case 'main':
                this.isMain = true;
                break;
            case 'header':
                this.isHeader = true;
                break;
            case 'footer':
                break;
            case 'filter':
                this.isFilter = true;
                break;
            case 'summary':
                this.isSummary = true;
                break;
            default: {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const never: never = role
            }
        }

        this.rowProxy = new Subgrid.DataRowProxy(this.schemaModel, this.dataModel);
        this._columnsManager.addBeforeCreateColumnsListener(this._columnsManagerBeforeCreateColumnsListener);

        this.selection = new Selection(_grid, _columnsManager, dataModel);
    }

    get selectionRectangles() { return this.selection.rectangles; }
    get selectionHasRectangles() {return this.selection.hasRectangles; }

    get allRowsSelected() { return this.selection.allRowsSelected; }

    /** @internal */
    destroy() {
        this._columnsManager.removeBeforeCreateColumnsListener(this._columnsManagerBeforeCreateColumnsListener);
        this._destroyed = true;
    }

    /** @internal */
    getRow(rowIndex: number) {
        if (this.dataModel.getRow !== undefined) {
            return this.dataModel.getRow(rowIndex);
        } else {
            this.rowProxy.____rowIndex = rowIndex;
            return this.rowProxy;
        }
    }

    /** @internal */
    getRowMetadata(rowIndex: number, prototype?: MetaModel.RowMetadataPrototype): undefined | false | MetaModel.RowMetadata {
        if (this.metaModel !== undefined && this.metaModel.getRowMetadata !== undefined) {
            return this.metaModel.getRowMetadata(rowIndex, prototype);
        } else {
            return this.rowMetadata[rowIndex];
        }
    }

    /** @internal */
    setRowMetadata(rowIndex: number, newMetadata?: MetaModel.RowMetadata) {
        if (this.metaModel !== undefined && this.metaModel.setRowMetadata !== undefined) {
            this.metaModel.setRowMetadata(rowIndex, newMetadata);
        } else {
            this.rowMetadata[rowIndex] = newMetadata;
        }
    }

    // Hooks
    /** @internal */
    getCellPaintConfig(beingPaintedCell: BeingPaintedCell): CellPaintConfig {
        let config: CellPaintConfig | undefined;
        const cellModel = this.cellModel;
        if (cellModel !== undefined) {
            if (cellModel.getCellPaintConfig !== undefined) {
                config = cellModel.getCellPaintConfig(beingPaintedCell);
            }
        }

        if (config === undefined) {
            return new CellPaintConfigAccessor(beingPaintedCell);
        } else {
            return config;
        }
    }

    /** @internal */
    getCellPainter(cellPaintConfig: CellPaintConfig, gridPainterKey: string): CellPainter {
        let painter: CellPainter | undefined;
        const cellModel = this.cellModel;
        if (cellModel !== undefined) {
            if (cellModel.getCellPainter !== undefined) {
                painter = cellModel.getCellPainter(cellPaintConfig, gridPainterKey);
            }
        }

        if (painter === undefined) {
            return this._grid.renderer.cellPainterRepository.get(gridPainterKey);
        } else {
            return painter;
        }
    }

    /** @internal */
    getCellEditorAt(columnIndex: number, rowIndex: number, editorName: string, cellEvent: CellEvent): CellEditor {
        let editor: CellEditor | undefined;

        const cellModel = this.cellModel;
        if (cellModel !== undefined) {
            if (cellModel.getCellEditorAt !== undefined) {
                editor = cellModel.getCellEditorAt(columnIndex, rowIndex, editorName, cellEvent);
            }
        }

        if (editor === undefined) {
            return cellEditorFactory.create(this._grid, editorName, cellEvent);
        } else {
            return editor;
        }
    }

    // Focus
    isRowFocused(rowIndex: number) {
        return this.focus.isRowFocused(rowIndex);
    }

    // Selection

    getSelectedRowCount() {
        return this.selection.getRowCount();
    }

    getSelectedRowIndices() {
        return this.selection.getRowIndices();
    }

    getSelectedColumnIndices() {
        return this.selection.getSelectedColumnIndices();
    }

    getLastSelectionType(n = 0) {
        return this.selection.getLastSelectionType(n);
    }

    getLastSelectionRectangle() {
        return this.selection.getLastRectangle();
    }

    /** Call before multiple selection changes to consolidate SelectionChange events.
     * Pair with endSelectionChange().
     */
    beginSelectionChange() {
        this.selection.beginChange();
    }

    /** Call after multiple selection changes to consolidate SelectionChange events.
     * Pair with beginSelectionChange().
     */
    endSelectionChange() {
        this.selection.endChange();
    }

    requestStashSelection() {
        if (this._nestedStashSelectionsRequestCount++ === 0) {
            this.stashSelection();
        }
    }

    requestUnstashSelection() {
        if (--this._nestedStashSelectionsRequestCount === 0) {
            this.unstashSelection();
        }
    }

    /**
     * @summary Select given region.
     * @param ox - origin x
     * @param oy - origin y
     * @param ex - extent x
     * @param ex - extent y
     */
    selectRectangle(ox: number, oy: number, ex: number, ey: number) {
        if (ox < 0 || oy < 0) {
            //we don't select negative area
            //also this means there is no origin mouse down for a selection rect
            return;
        }
        this.selection.selectRectangle(ox, oy, ex, ey);
    }

    selectCell(x: number, y: number, silent = false) {
        const keepRowSelections = this._grid.properties.checkboxOnlyRowSelections;
        this.beginSelectionChange();
        try {
            this.selection.clear(keepRowSelections);
            this.selection.selectRectangle(x, y, 0, 0, silent);
        } finally {
            this.endSelectionChange();
        }
    }

    selectColumns(x1: number, x2?: number) {
        this.selection.selectColumns(x1, x2);
    }

    selectRows(y1: number, y2?: number) {
        const sm = this.selection;

        if (this._grid.properties.singleRowSelectionMode) {
            sm.clearRowSelection();
            y2 = y1;
        } else {
            if (y2 === undefined) {
                y2 = y1;
            }
        }

        sm.selectRows(Math.min(y1, y2), Math.max(y1, y2));
    }

    selectAllRows() {
        this.selection.selectAllRows();
    }

    toggleSelectColumn(x: number, shiftKeyDown: boolean, ctrlKeyDown: boolean) {
        const model = this.selection;
        const alreadySelected = model.isColumnSelected(x);
        this.beginSelectionChange();
        try {
            if (!ctrlKeyDown && !shiftKeyDown) {
                model.clear();
                if (!alreadySelected) {
                    model.selectColumns(x);
                }
            } else {
                if (ctrlKeyDown) {
                    if (alreadySelected) {
                        model.deselectColumn(x);
                    } else {
                        model.selectColumns(x);
                    }
                }
                if (shiftKeyDown) {
                    model.clear();
                    model.selectColumns(this.lastEdgeSelection[0], x);
                }
            }
            if (!alreadySelected && !shiftKeyDown) {
                this.lastEdgeSelection[0] = x;
            }
        } finally {
            this.endSelectionChange();
        }
        this._grid.repaint();
        this._grid.fireSyntheticColumnSelectionChangedEvent();
    }

    toggleSelectRow(y: number, shiftKeyDown: boolean) {
        //we can select the totals rows if they exist, but not rows above that
        const sm = this.selection;
        const alreadySelected = sm.isRowSelected(y);

        this.beginSelectionChange();
        try {
            if (alreadySelected) {
                sm.deselectRow(y);
            } else {
                if (this._grid.properties.singleRowSelectionMode) {
                    sm.clearRowSelection();
                }
                sm.selectRows(y);
            }

            if (shiftKeyDown) {
                sm.clear();
                sm.selectRows(this.lastEdgeSelection[1], y);
            }

            if (!alreadySelected && !shiftKeyDown) {
                this.lastEdgeSelection[1] = y;
            }
        } finally {
            this.endSelectionChange();
        }

        this._grid.repaint();
    }

    toggleSelectAllRows() {
        if (this.allRowsSelected) {
            this.selection.clear();
        } else {
            this.selectAllRows();
        }
        this._grid.repaint();
    }

    /**
     * @desc Clear all the selections.
     */
    clearSelection() {
        const keepRowSelections = this._grid.properties.checkboxOnlyRowSelections;
        this.selection.clear(keepRowSelections);
    }

    /**
     * @desc Clear the most recent selection.
     */
    clearMostRecentRectangleSelection(keepRowSelections: boolean) {
        this.selection.clearMostRecentRectangleSelection(keepRowSelections);
    }

    /**
     * @desc Clear the most recent column selection.
     */
    clearMostRecentColumnSelection() {
        this.selection.restorePreviousColumnSelection();
    }

    /**
     * @desc Clear the most recent row selection.
     */
    clearMostRecentRowSelection() {
        //this.selectionModel.clearMostRecentRowSelection(); // commented off as per GRID-112
    }

    /**
     * @returns Given point is selected.
     * @param x - The horizontal coordinate.
     * @param y - The vertical coordinate.
     */
    isSelected(x: number, y: number): boolean {
        return this.selection.isSelected(x, y);
    }

    /**
     * @returns The given column is selected anywhere in the entire table.
     * @param y - The row index.
     */
    isCellSelectedInRow(y: number): boolean {
        return this.selection.isCellSelectedInRow(y);
    }

    /**
     * @returns The given row is selected anywhere in the entire table.
     * @param x - The column index.
     */
    isCellSelectedInColumn(x: number): boolean {
        return this.selection.isCellSelectedInColumn(x);
    }

    isColumnOrRowSelected() {
        return this.selection.isColumnOrRowSelected();
    }

    isInCurrentSelectionRectangle(x: number, y: number) {
        return this.selection.isInCurrentSelectionRectangle(x, y);
    }

    /**
     * @returns An object that represents the currently selection row.
     */
    getFirstSelectionRectangleTopRowValues() {
        const rectangles = this.selection.rectangles;
        if (rectangles.length > 0) {
            const dataModel = this.dataModel;
            const columnsManager = this._columnsManager;
            const colCount = this._columnsManager.getActiveColumnCount();
            const topSelectedRow = rectangles[0].origin.y;
            const row = {
                    //hierarchy: behavior.getFixedColumnValue(0, topRow)
                };

            for (let c = 0; c < colCount; c++) {
                const column = columnsManager.getActiveColumn(c);
                row[column.name] = dataModel.getValue(column.schemaColumn, topSelectedRow);
            }

            return row;
        } else {
            return undefined;
        }
    }

    getRowSelectionData(hiddenColumns: boolean | number[] | string[]): DataModel.DataRow {
        const selectedRowIndexes = this.selection.getRowIndices();
        const columns = this.getActiveAllOrSpecifiedColumns(hiddenColumns);
        const result: DataModel.DataRow = {};

        for (let c = 0, C = columns.length; c < C; c++) {
            const column = columns[c];
            const rows = result[column.name] = new Array(selectedRowIndexes.length);
            selectedRowIndexes.forEach( (selectedRowIndex, j) => {
                const dataRow = this.getRow(selectedRowIndex) as DataModel.DataRow; // should always exist
                rows[j] = this.valOrFunc(dataRow, column);
            });
        }

        return result;
    }

    getRowSelectionMatrix(hiddenColumns?: boolean | number[] | string[]): Array<Array<DataModel.DataValue>> {
        const selectedRowIndexes = this.selection.getRowIndices();
        const columns = this.getActiveAllOrSpecifiedColumns(hiddenColumns);
        const result = new Array<Array<DataModel.DataValue>>(columns.length);

        for (let c = 0, C = columns.length; c < C; c++) {
            const column = columns[c];
            result[c] = new Array<DataModel.DataValue>(selectedRowIndexes.length);
            selectedRowIndexes.forEach(
                (selectedRowIndex, r) => {
                    const dataRow = this.getRow(selectedRowIndex) as DataModel.DataRow; // should always exist
                    result[c][r] = this.valOrFunc(dataRow, column);
                }
            );
        }

        return result;
    }

    getColumnSelectionMatrix(): DataModel.DataValue[][] {
        const columnsManager = this._columnsManager;
        const selectedColumnIndexes = this.getSelectedColumnIndices();
        const numRows = this.dataModel.getRowCount();
        const result = new Array<Array<DataModel.DataValue>>(selectedColumnIndexes.length);

        selectedColumnIndexes.forEach((selectedColumnIndex, c) => {
            const column = columnsManager.getActiveColumn(selectedColumnIndex);
            const values = result[c] = new Array<DataModel.DataValue>(numRows);

            for (let r = 0; r < numRows; r++) {
                const dataRow = this.getRow(r) as DataModel.DataRow; // should always exist;
                values[r] = this.valOrFunc(dataRow, column);
            }
        });

        return result;
    }

    getSelectedColumnsValues() {
        const columnsManager = this._columnsManager;
        const selectedColumnIndexes = this.getSelectedColumnIndices();
        const result: Revgrid.ColumnsDataValuesObject = {};
        const rowCount = this.dataModel.getRowCount();

        selectedColumnIndexes.forEach((selectedColumnIndex) => {
            const column = columnsManager.getActiveColumn(selectedColumnIndex);
            const values = result[column.name] = new Array<DataModel.DataValue>(rowCount);

            for (let r = 0; r < rowCount; r++) {
                const dataRow = this.getRow(r) as DataModel.DataRow; // should always exist;
                values[r] = this.valOrFunc(dataRow, column);
            }
        });

        return result;
    }

    getSelectedValuesByRectangleAndColumn(): Revgrid.ColumnsDataValuesObject[] {
        const columnsManager = this._columnsManager;
        const selectionRectangles = this.selection.rectangles;
        const rects = new Array<Revgrid.ColumnsDataValuesObject>(selectionRectangles.length);

        selectionRectangles.forEach(
            (selectionRect, i) => {
                const colCount = selectionRect.width;
                const rowCount = selectionRect.height;
                const columns: Revgrid.ColumnsDataValuesObject = {};

                for (let c = 0, x = selectionRect.origin.x; c < colCount; c++, x++) {
                    const column = columnsManager.getActiveColumn(x);
                    const values = columns[column.name] = new Array<DataModel.DataValue>(rowCount);

                    for (let r = 0, y = selectionRect.origin.y; r < rowCount; r++, y++) {
                        const dataRow = this.getRow(y) as DataModel.DataRow; // should always exist;
                        values[r] = this.valOrFunc(dataRow, column);
                    }
                }

                rects[i] = columns;
            }
        );

        return rects;
    }

    getSelectedValuesByRectangleColumnRowMatrix(): DataModel.DataValue[][][] {
        const columnsManager = this._columnsManager;
        const rectangles = this.selection.rectangles;
        const rects = new Array<Array<Array<DataModel.DataValue>>>(rectangles.length);

        rectangles.forEach(
            (rect, i) => {
                const colCount = rect.width;
                const rowCount = rect.height;
                const rows = new Array<Array<DataModel.DataValue>>();

                for (let c = 0, x = rect.origin.x; c < colCount; c++, x++) {
                    const values = rows[c] = new Array<DataModel.DataValue>(rowCount);
                    const column = columnsManager.getActiveColumn(x);

                    for (let r = 0, y = rect.origin.y; r < rowCount; r++, y++) {
                        const dataRow = this.getRow(y) as DataModel.DataRow; // should always exist;
                        values[r] = this.valOrFunc(dataRow, column);
                    }
                }

                rects[i] = rows;
            }
        );

        return rects;
    }

    /**
     * @returns Tab separated value string from the selection and our data.
     */
    getSelectionAsTSV(): string {
        const selectionType = this.selection.getLastSelectionType();
        switch (selectionType) {
            case SelectionType.Cell: {
                const selectionMatrix = this.getSelectedValuesByRectangleColumnRowMatrix();
                const selections = selectionMatrix[selectionMatrix.length - 1];
                return this.getMatrixSelectionAsTSV(selections);
            }
            case SelectionType.Row: {
                return this.getMatrixSelectionAsTSV(this.getRowSelectionMatrix());
            }
            case SelectionType.Column: {
                return this.getMatrixSelectionAsTSV(this.getColumnSelectionMatrix());
            }
            case undefined: {
                return '';
            }
            default:
                throw new UnreachableCaseError('MSGSATSV12998', selectionType);
        }
    }

    getMatrixSelectionAsTSV(selections: Array<Array<DataModel.DataValue>>) {
        let result = '';

        //only use the data from the last selection
        if (selections.length) {
            const width = selections.length;
            const height = selections[0].length;
            const area = width * height;
            const lastCol = width - 1;
                //Whitespace will only be added on non-singular rows, selections
            const whiteSpaceDelimiterForRow = (height > 1 ? '\n' : '');

            //disallow if selection is too big
            if (area > 20000) {
                alert('selection size is too big to copy to the paste buffer'); // eslint-disable-line no-alert
                return '';
            }

            for (let h = 0; h < height; h++) {
                for (let w = 0; w < width; w++) {
                    result += selections[w][h] + (w < lastCol ? '\t' : whiteSpaceDelimiterForRow);
                }
            }
        }

        return result;
    }

    /** @internal */
    // private handleDataModelEvent(nameOrEvent: DataModel.EventName | DataModel.Event) {
    //     let type: DataModel.EventName;
    //     let dataModelEvent: DataModel.Event;
    //     switch (typeof nameOrEvent) {
    //         case 'string':
    //             type = nameOrEvent as DataModel.EventName;
    //             dataModelEvent = { type };
    //             break;
    //         case 'object':
    //             if ('type' in nameOrEvent) {
    //                 type = nameOrEvent.type;
    //                 break;
    //             } else {
    //                 throw new HypergridError('Expected data model event to be: (string | {type:string})');
    //             }
    //         default:
    //             throw new HypergridError('Expected data model event to be: (string | {type:string})');
    //     }

    //     if (!DataModel.REGEX_DATA_EVENT_STRING.test(type)) {
    //         throw new HypergridError('Expected data model event type "' + type + '" to match ' + DataModel.REGEX_DATA_EVENT_STRING + '.');
    //     }

    //     const nativeHandler = this.dataModelEventMap[type];
    //     let dispatched: boolean | undefined;
    //     if (nativeHandler) {
    //         dispatched = nativeHandler(dataModelEvent);
    //     }

    //     return dispatched !== undefined ? dispatched : this._dataModelEventDispatchHandler(type, dataModelEvent);
    // }

    /**
     * @desc These handlers are called by {@link dispatchDataModelEvent dataModel.dispatchEvent} to perform Hypergrid housekeeping tasks.
     *
     * (Hypergrid registers itself with the data model by calling `dataModel.addListener`. Both `addListener` and `dispatchEvent` are optional API. If the data model lacks `addListener`, Hypergrid inserts a bound version of `dispatchEvent` directly into the data model.)
     *
     * #### Coding pattern
     * If there are no housekeeping tasks to be performed, do not define a handler here.
     *
     * Otherwise, the typical coding pattern is for our handler to perform the housekeeping tasks, returning `undefined` to the caller ({@link DispatchDataModelEvent}) which then re-emits the event as a Hypergrid event (_i.e.,_ as a DOM event to the `<canvas>` element).
     *
     * Alternatively, our handler can re-emit the event itself by calling the grid event handler and propagating its boolean return value value to the caller which signals the caller _not_ to re-emit on our behalf. This is useful when tasks need to be performed _after_ the Hypergrid event handler is called (or before _and_ after).
     *
     * The pattern, in general:
     * ```js
     * exports['rev-hypergrid-data-myevent'] = function(event) {
     *     var notCanceled;
     *
     *     PerformHousekeepingTasks();
     *
     *     // optionally re-emit the event as a grid event
     *     import { dispatchGridEvent } from '../../lib/dispatchGridEvent.js';
     *     notCanceled = dispatchGridEvent.call(this, event.type, isCancelable, event);
     *
     *     if (!notCanceled) {
     *         PerformAdditionalHousekeepingTasks()
     *     }
     *
     *     return notCanceled;
     * }
     * Re-emitting the event is optional; if `notCanceled` is never defined, the caller will take care of it. If your handler does choose to re-emit the event itself by calling `dispatchGridEvent`, you should propagate its return value (the result of its internal call to [`dispatchEvent`](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent), which is either `false` if the event was canceled or `true` if it was not).
     *
     */

    // /** @internal */
    // private handleFinHypergridSchemaLoaded(): boolean | undefined {
    //     this.rowProxy.updateSchema();
    //     return this._schemaLoadedEventHandler();
    // }

    // /** @internal */
    // private handleFinHypergridDataLoaded(): boolean | undefined {
    //     return this._dataLoadedEventHandler();
    // }

    // /** @internal */
    // private handleFinHypergridDataShapeChanged(): boolean | undefined {
    //     return this._dataShapeChangedEventHandler();
    // }

    // /** @internal */
    // private handleFinHypergridDataPrereindex(): boolean | undefined {
    //     return this._dataPrereindexEventHandler();
    // }

    // private handleFinHypergridDataPostreindex(): boolean | undefined {
    //     return this._dataPostreindexEventHandler();
    // }

    // Same events as above except using notifier

    // abstract getRowCount(): number;
    // abstract getValue(columnIndex: number, rowIndex: number): unknown;
    // abstract getSchema(): (RawColumnSchema | ColumnSchema)[];



    // // Fallbacks

    // // eslint-disable-next-line @typescript-eslint/no-empty-function
    // apply() {

    // }

    // isTree() {
    //     return false;
    // }

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // isTreeCol(columnIndex: number) {
    //     return false;
    // }

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // toggleRow(rowIndex: number, columnIndex?: number, toggle?: boolean) {
    //     return undefined;
    // }

    // getColumnCount() {
    //     return this.getSchema().length;
    // }

    // getRow(y: number): DataRowObject {
    //     this.$rowProxy$.$y$ = y;
    //     return this.$rowProxy$;
    // }

    // getData(metadataFieldName: string) {
    //     const Y = this.getRowCount();
    //     const rows = new Array(Y);

    //     for (let y = 0; y < Y; y++) {
    //         const row = this.getRow(y);
    //         if (row !== undefined) {
    //             rows[y] = Object.assign({}, row);
    //             if (metadataFieldName) {
    //                 const metadata = this.getRowMetadata(y);
    //                 if (metadata) {
    //                     rows[y][metadataFieldName] = metadata;
    //                 }
    //             }
    //         }
    //     }

    //     return rows;
    // }

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // setData(data: DataRowObject[], schema: RawColumnSchema[]) {
    //     // fail silently because Local.js::setData currently calls this for every subgrid
    // }

    // setValue(x: number, y: number, value: unknown) {
    //     console.warn('dataModel.setValue(' + x + ', ' + y + ', "' + value + '") called but no implementation. Data not saved.');
    // }

    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // setSchema(schema: ColumnSchema[]) {
    //     console.warn('dataModel.setSchema(schema) called but no implementation. Schema not updated.');
    // }

    // getRowIndex(y: number) {
    //     return y;
    // }

    // /** @implements DataModel#getRowMetadata */
    // getRowMetadata(y: number, prototype?: null): undefined | RowMetadata {
    //     return this.metadata[y] || prototype !== undefined && (this.metadata[y] = Object.create(prototype));
    // }

    // getMetadataStore() {
    //     return this.metadata;
    // }

    // setRowMetadata(y: number, metadata: RowMetadata) {
    //     if (metadata !== undefined) {
    //         this.metadata[y] = metadata;
    //     } else {
    //         delete this.metadata[y];
    //     }
    //     return !!metadata;
    // }

    // setMetadataStore(newMetadataStore: RowMetadata[] | undefined) {
    //     this.metadata = newMetadataStore ?? [];
    // }

    /**
     * @returns '' if data value is undefined
     * @internal
     */
    private valOrFunc(dataRow: DataModel.DataRow, column: Column): (DataModel.DataValue | '') {
        if (Array.isArray(dataRow)) {
            return dataRow[column.schemaColumn.index];
        } else {
            let result: DataModel.DataValue;
            if (dataRow) {
                result = dataRow[column.name];
                const calculator = (((typeof result)[0] === 'f' && result) || column.calculator) as SchemaModel.Column.CalculateFunction;
                if (calculator) {
                    result = calculator(dataRow, column.name);
                }
            }
            return result || result === 0 || result === false ? result : '';
        }
    }

    private stashSelection() {
        if (this._selectionStash !== undefined) {
            throw new AssertError('MSSS86665');
        } else {
            this._selectionStash = this.selection.createStash();
            this.selection.clear();
        }
    }

    private unstashSelection() {
        const selectionStash = this._selectionStash;
        if (selectionStash === undefined) {
            throw new AssertError('MSUS86665');
        } else {
            this._selectionStash = undefined;
            this.selection.restoreStash(selectionStash);
        }
    }

    /**
     * @param hiddenColumns - One of:
     * `false or undefined` - Active column list
     * `true` - All column list
     * `Array` - Active column list with listed columns prefixed as needed (when not already in the list). Each item in the array may be either:
     * * `number` - index into all column list
     * * `string` - name of a column from the all column list
     * @internal
     */
    private getActiveAllOrSpecifiedColumns(hiddenColumns: boolean | number[] | string[] | undefined): readonly Column[] {
        const allColumns = this._columnsManager.allColumns;
        const activeColumns = this._columnsManager.activeColumns;

        if (hiddenColumns === undefined) {
            return activeColumns;
        } else {
            if (Array.isArray(hiddenColumns)) {
                let columns: Column[] = [];
                hiddenColumns.forEach((index: number | string) => {
                    const key = typeof index === 'number' ? 'index' : 'name';
                    const column = allColumns.find((allColumn) => { return allColumn[key] === index; });
                    if (column !== undefined) {
                        if (activeColumns.indexOf(column) < 0) {
                            columns.push(column);
                        }
                    }
                });
                columns = columns.concat(activeColumns);
                return columns;
            } else {
                return hiddenColumns ? allColumns : activeColumns;
            }
        }
    }
}

/** @public */
export namespace Subgrid {
    export const enum RoleEnum {
        main = 'main',
        header = 'header',
        footer = 'footer',
        filter = 'filter',
        summary = 'summary',
    }

    export type Role = keyof typeof RoleEnum;

    export interface Spec {
        role?: Role, // defaults to main
        dataModel: DataModel | DataModel.Constructor,
        metaModel?: MetaModel | MetaModel.Constructor,
        cellModel?: CellModel | CellModel.Constructor,
    }

    /** @internal */
    export class DataRowProxy {
        [columnName: string]: DataModel.DataValue;

        ____rowIndex: number;
        ____columnNames: string[] = [];

        constructor(public schemaModel: SchemaModel, public dataModel: DataModel) {
            this.updateSchema(); // is this necessary? If we do not always get the "rev-schema-loaded" event then it is necessary
        }

        updateSchema() {
            const existingCount = this.____columnNames.length;
            for (let i = 0; i < existingCount; i++) {
                const columnName = this.____columnNames[i];
                delete this[columnName];
            }
            this.____columnNames.length = 0;
            const schema = this.schemaModel.getSchema();
            const newCount = schema.length;
            for (let i = 0; i < newCount; i++) {
                const schemaColumn = schema[i]; // variable for closure
                const columnName = schemaColumn.name;
                this.____columnNames.push(columnName)
                Object.defineProperty(this, columnName, {
                    // enumerable: true, // is a real data field
                    configurable: true,
                    get: () => { return this.dataModel.getValue(schemaColumn, this.____rowIndex); },
                    set: (value: DataModel.DataValue) => {
                        if (this.dataModel.setValue !== undefined) {
                            this.dataModel.setValue(schemaColumn, this.____rowIndex, value);
                        }
                        return undefined;
                    }
                });
            }
        }
    }

}
