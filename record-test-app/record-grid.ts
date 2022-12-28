import { GridSettings } from 'grid-settings';
import {
    CellEvent,
    CellPainter,
    EventDetail,
    GridProperties,
    Halign,
    ListChangedTypeId,
    Revgrid,
    RevRecordCellAdapter,
    RevRecordField,
    RevRecordFieldAdapter,
    RevRecordFieldIndex,
    RevRecordHeaderAdapter,
    RevRecordIndex,
    RevRecordMainAdapter,
    RevRecordStore,
    SelectionDetail,
    Subgrid,
    UnreachableCaseError
} from "..";
import {
    DateValGridField,
    GridField,
    HiddenStrValGridField,
    IntValGridField,
    NumberValGridField,
    RecordIndexGridField,
    StatusIdValGridField,
    StrValGridField
} from './grid-field';

export class RecordGrid extends Revgrid {
    fieldSortedEventer: RecordGrid.FieldSortedEventer | undefined;
    columnWidthChangedEventer: RecordGrid.ColumnWidthChangedEventer | undefined;

    recordFocusEventer: RecordGrid.RecordFocusEventer | undefined;
    recordFocusClickEventer: RecordGrid.RecordFocusClickEventer | undefined;
    recordFocusDblClickEventer: RecordGrid.RecordFocusDblClickEventer | undefined;
    resizedEventer: RecordGrid.ResizedEventer | undefined;
    columnsViewWidthsChangedEventer: RecordGrid.ColumnsViewWidthsChangedEventer | undefined;
    renderedEventer: RecordGrid.RenderedEventer | undefined;

    private _lastNotifiedFocusedRecordIndex: number | undefined;

    private readonly _fieldAdapter: RevRecordFieldAdapter;
    private readonly _headerRecordAdapter: RevRecordHeaderAdapter;
    private readonly _mainRecordAdapter: RevRecordMainAdapter;

    private readonly _recordIndexGridField = new RecordIndexGridField();
    private readonly _hiddenStrValGridField = new HiddenStrValGridField();
    private readonly _intValGridField = new IntValGridField();
    private readonly _strValGridField = new StrValGridField();
    private readonly _numberValGridField = new NumberValGridField();
    private readonly _dateValGridField = new DateValGridField();
    private readonly _statusIdValGridField = new StatusIdValGridField();

    constructor(
        gridElement: HTMLElement,
        recordStore: RevRecordStore,
        mainCellPainter: CellPainter,
        gridProperties: Partial<GridProperties>,
    ) {
        const fieldAdapter = new RevRecordFieldAdapter();
        const mainRecordAdapter = new RevRecordMainAdapter(fieldAdapter, recordStore);
        const headerRecordAdapter = new RevRecordHeaderAdapter();

        const recordCellAdapter = new RevRecordCellAdapter(mainRecordAdapter, mainCellPainter);

        const options: Revgrid.Options = {
            adapterSet: {
                schemaModel: fieldAdapter,
                subgrids: [
                    {
                        role: Subgrid.RoleEnum.header,
                        dataModel: headerRecordAdapter,
                    },
                    {
                        role: Subgrid.RoleEnum.main,
                        dataModel: mainRecordAdapter,
                        cellModel: recordCellAdapter,
                    }
                ],
            },
            gridProperties,
            loadBuiltinFinbarStylesheet: false,
        };

        super(gridElement, options);

        this._fieldAdapter = fieldAdapter;
        this._headerRecordAdapter = headerRecordAdapter;
        this._mainRecordAdapter = mainRecordAdapter;

        this.allowEvents(true);

        this.addFieldsToAdapter();
    }

    get fieldCount(): number { return this._fieldAdapter.fieldCount; }

    get strValGridField() { return this._strValGridField; }
    get hiddenStrValGridField() { return this._hiddenStrValGridField; }

    get sortable(): boolean { return this.properties.sortable; }
    set sortable(value: boolean) { this.properties.sortable = value; }

    get columnCount(): number { return this.getActiveColumnCount(); }

    get continuousFiltering(): boolean { return this._mainRecordAdapter.continuousFiltering; }
    set continuousFiltering(value: boolean) { this._mainRecordAdapter.continuousFiltering = value}

    get filterCallback(): RevRecordMainAdapter.RecordFilterCallback | undefined { return this._mainRecordAdapter.filterCallback; }
    set filterCallback(value: RevRecordMainAdapter.RecordFilterCallback | undefined) { this._mainRecordAdapter.filterCallback = value}

    get rowOrderReversed(): boolean { return this._mainRecordAdapter.rowOrderReversed; }
    set rowOrderReversed(value: boolean) { this._mainRecordAdapter.rowOrderReversed = value}

    // get fieldCount(): number { return this._fieldAdapter.fieldCount; }

    get focusedRecordIndex(): RevRecordIndex | undefined {
        const selections = this.selections;

        if (selections === null || selections.length === 0) {
            return undefined;
        } else {
            const rowIndex = selections[0].firstSelectedCell.y;

            // RevGrid doesn't adjust the current selection index if rows are deleted, so make sure it's still valid
            if (rowIndex >= this._mainRecordAdapter.rowCount) {
                return undefined;
            } else {
                return this._mainRecordAdapter.getRecordIndexFromRowIndex(rowIndex)
            }
        }
    }

    set focusedRecordIndex(recordIndex: number | undefined) {
        if (recordIndex === undefined) {
            this.clearSelections();
        } else {
            const rowIndex = this._mainRecordAdapter.getRowIndexFromRecordIndex(recordIndex);

            if (rowIndex === undefined) {
                this.clearSelections();
            } else {
                this.selectRows(rowIndex, rowIndex);
            }
        }
    }

    get headerRowCount(): number {
        return this._headerRecordAdapter.getRowCount();
    }

    get isFiltered(): boolean { return this._mainRecordAdapter.isFiltered; }
    get sortColumns(): number { return this._mainRecordAdapter.sortColumnCount; }

    get gridRightAligned(): boolean { return this.properties.gridRightAligned; }
    get rowHeight(): number { return this.properties.defaultRowHeight; }

    get rowRecIndices(): number[] {
        return [];
        // todo
    }

    setRecentDurations(allChanged: number, recordInserted: number, recordUpdated: number, valueChanged: number): void {
        this._mainRecordAdapter.allChangedRecentDuration = allChanged;
        this._mainRecordAdapter.recordInsertedRecentDuration = recordInserted;
        this._mainRecordAdapter.recordUpdatedRecentDuration = recordUpdated;
        this._mainRecordAdapter.valueChangedRecentDuration = valueChanged;
    }

    autoSizeColumnWidth(columnIndex: number): void {
        this.autosizeColumn(columnIndex);
    }

    autoSizeFieldColumnWidth(field: RevRecordField): void {
        const fieldIndex = this._fieldAdapter.getFieldIndex(field);
        const columnIndex = this.getActiveColumnIndexUsingFieldIndex(fieldIndex);

        if (columnIndex < 0) {
            throw new RangeError('Field is not visible');
        }

        this.autosizeColumn(columnIndex);
    }

    getField(fieldIdx: number) {
        return this._fieldAdapter.getField(fieldIdx) as GridField;
    }

    getFieldIndex(field: RevRecordField): RevRecordFieldIndex {
        return this._fieldAdapter.getFieldIndex(field);
    }

    getFieldNameToHeaderMap(): RecordGrid.FieldNameToHeaderMap {
        const result = new Map<string, string | undefined>();
        const fields = this._fieldAdapter.fields;
        for (let i = 0; i < fields.length; i++) {
            const state = this.getFieldState(i);
            const field = fields[i];
            result.set(field.name, state.header);
        }
        return result;
    }

    getFieldState(field: RevRecordFieldIndex | RevRecordField): RecordGrid.FieldState {
        const fieldIndex = typeof field === 'number' ? field : this.getFieldIndex(field);
        const column = this.getAllColumn(fieldIndex);
        const columnProperties = column.properties;

        return {
            width: !columnProperties.columnAutosized ? columnProperties.width : undefined,
            header: (column.schemaColumn as RevRecordField.SchemaColumn).header,
            alignment: columnProperties.halign
        };
    }

    getFieldWidth(field: RevRecordFieldIndex | RevRecordField): number | undefined {
        const fieldIndex = typeof field === 'number' ? field : this.getFieldIndex(field);
        const columnProperties = this.getAllColumn(fieldIndex).properties;

        return !columnProperties.columnAutosized ? columnProperties.width : undefined;
    }

    getFieldVisible(field: RevRecordFieldIndex | RevRecordField): boolean {
        const fieldIndex = typeof field === 'number' ? field : this.getFieldIndex(field);
        const activeColumns = this.getActiveColumns();
        return activeColumns.findIndex(column => (column.schemaColumn as RevRecordField.SchemaColumn).index === fieldIndex) !== -1;
    }

    getHeaderPlusFixedLineHeight(): number {
        const gridProps = this.properties;
        const rowHeight = gridProps.defaultRowHeight;
        let lineWidth = gridProps.fixedLinesHWidth;
        if (lineWidth === undefined) {
            lineWidth = gridProps.gridLinesHWidth;
        }
        return rowHeight + lineWidth;
    }

    getVisibleFields(): RevRecordFieldIndex[] {
        return this.getActiveColumns().map(column => (column.schemaColumn as RevRecordField.SchemaColumn).index);
    }

    isIntValGridField(field: GridField) {
        return field === this._intValGridField;
    }

    isRecordIndexGridFieldIndex(fieldIndex: RevRecordFieldIndex) {
        const field = this.getField(fieldIndex);
        return field === this._recordIndexGridField;
    }

    isHeaderRow(rowIndex: number): boolean {
        return rowIndex > this.headerRowCount;
    }

    moveActiveColumn(fromColumnIndex: number, toColumnIndex: number): void {
        this.showColumns(true, fromColumnIndex, toColumnIndex, false);
    }

    moveFieldColumn(field: RevRecordFieldIndex | RevRecordField, toColumnIndex: number): void {
        const fieldIndex = typeof field === 'number' ? field : this.getFieldIndex(field);
        const fromColumnIndex = this.getActiveColumnIndexUsingFieldIndex(fieldIndex);

        if (fromColumnIndex < 0) {
            throw new Error(`Move Field Error: ${fieldIndex}, ${this._fieldAdapter.getField(fieldIndex).name}`);
        }

        this.moveActiveColumn(fromColumnIndex, toColumnIndex);
    }

    recordToRowIndex(recordIndex: RevRecordIndex): number {
        const rowIndex = this._mainRecordAdapter.getRowIndexFromRecordIndex(recordIndex);
        if (rowIndex === undefined) {
            throw new Error(`RecordToRowIndex ${recordIndex}`);
        } else {
            return rowIndex;
        }
        // return this._rowLookup.getLeftIndex(recIdx);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reorderRecRows(itemIndices: number[]): void {
        // todo
    }

    rowToRecordIndex(rowIndex: number): number {
        const recIdx = this._mainRecordAdapter.getRecordIndexFromRowIndex(rowIndex);
        if (recIdx === undefined) {
            throw new Error(`RowToRecordIndex ${rowIndex}`);
        } else {
            return recIdx;
        }
    }

    setFieldHeader(fieldOrIdx: RevRecordFieldIndex | RevRecordField, header: string): void {
        const fieldIndex = this._fieldAdapter.setFieldHeader(fieldOrIdx, header);

        this._headerRecordAdapter.invalidateCell(fieldIndex);
    }

    setFieldState(field: RevRecordField, state: RecordGrid.FieldState): void {
        // const fieldIndex = typeof field === 'number' ? field : this.getFieldIndex(field);
        const fieldIndex = this.getFieldIndex(field);

        if (state === undefined) {
            state = {};
        }

        const columnIndex = this.getActiveColumnIndexUsingFieldIndex(fieldIndex);

        if (columnIndex < 0) {
            return;
        }

        const column = this.getAllColumn(columnIndex);

        // Update the schema
        const header = state.header ?? field.name
        this.setFieldHeader(fieldIndex, header);

        // Update any properties
        if (state.alignment !== undefined) {
            column.properties.halign = state.alignment;
        }

        // Update the width
        if (state.width === undefined) {
            column.checkColumnAutosizing(true);
        } else {
            column.setWidth(state.width);
        }

        // Update Hypergrid schema
        // if (this.updateCounter == 0 && this.dispatchEvent !== undefined)
        // 	this.dispatchEvent('fin-hypergrid-schema-loaded');
    }

    setFieldsVisible(fields: (RevRecordFieldIndex | RevRecordField)[], visible: boolean): void {
        const fieldIndexes = fields.map(field => typeof field === 'number' ? field : this.getFieldIndex(field));

        if (visible) {
            this.showColumns(false, fieldIndexes);
        } else {
            this.showColumns(false, fieldIndexes, -1);
        }
    }

    setFieldWidth(field: RevRecordFieldIndex | RevRecordField, width?: number): void {
        const fieldIndex = typeof field === 'number' ? field : this.getFieldIndex(field);
        const column = this.getAllColumn(fieldIndex);

        if (width === undefined) {
            column.checkColumnAutosizing(true);
        } else {
            column.setWidth(width);
        }

        // Update Hypergrid schema
        // if (this.updateCounter == 0 && this.dispatchEvent !== undefined)
        // 	this.dispatchEvent('fin-hypergrid-schema-loaded');
    }

    setFieldVisible(field: RevRecordFieldIndex | RevRecordField, visible: boolean): void {
        const fieldIndex = typeof field === 'number' ? field : this.getFieldIndex(field);
        const column = this.getActiveColumns().find((activeColumn) => activeColumn.index === fieldIndex);

        if ((column !== undefined) === visible) {
            return;
        } // Visibility remains unchanged

        // Are we hiding the column?
        if (column !== undefined) {
            this.showColumns(false, fieldIndex, -1);
            return;
        }

        // No, so we're showing it
        // TODO: Work out roughly where to insert it. At the moment it goes on the end
        this.showColumns(false, fieldIndex);
    }

    override fireSyntheticColumnSortEvent(eventDetail: EventDetail.ColumnSort): boolean {
        const column = eventDetail.column;
        const fieldIndex = column.schemaColumn.index;

        this._mainRecordAdapter.sortBy(fieldIndex);

        return super.fireSyntheticColumnSortEvent(eventDetail);
    }

    override fireSyntheticClickEvent(event: CellEvent): boolean {
        const gridY = event.gridCell.y;
        if (gridY !== 0) { // Skip clicks to the column headers
            if (this.recordFocusClickEventer !== undefined) {
                const rowIndex = event.dataCell.y;
                const recordIndex = this._mainRecordAdapter.getRecordIndexFromRowIndex(rowIndex);
                if (recordIndex === undefined) {
                    throw new Error('fireSyntheticClickEvent');
                } else {
                    const fieldIndex = event.dataCell.x;
                    this.recordFocusClickEventer(fieldIndex, recordIndex);
                }
            }
        }
        return super.fireSyntheticClickEvent(event);
    }

    private handleMouseDown(/*rowIndex: number, fieldIndex: number, gridY: number*/): void {
        /*if (gridY === 0) {
            return;
        } // Skip clicks to the column headers

        const recordIndex = this.rowLookup.getLeftIndex(rowIndex)!;

        this.recordFocusEventer!(recordIndex, fieldIndex);*/
    }

    override fireSyntheticDoubleClickEvent(event: CellEvent): boolean {
        if (event.gridCell.y !== 0) { // Skip clicks to the column headers
            if (this.recordFocusDblClickEventer !== undefined) {
                const rowIndex = event.dataCell.y;
                const recordIndex = this._mainRecordAdapter.getRecordIndexFromRowIndex(rowIndex);
                if (recordIndex === undefined) {
                    throw new Error('handleGridDblClickEvent');
                } else {
                    this.recordFocusDblClickEventer(event.dataCell.x, recordIndex);
                }
            }
        }

        return super.fireSyntheticDoubleClickEvent(event);
    }

    override fireSyntheticSelectionChangedEvent(event: SelectionDetail): boolean {
        const selections = event.selections;

        if (selections.length === 0) {
            if (this._lastNotifiedFocusedRecordIndex !== undefined) {
                const oldSelectedRecordIndex = this._lastNotifiedFocusedRecordIndex;
                this._lastNotifiedFocusedRecordIndex = undefined;
                const recordFocusEventer = this.recordFocusEventer;
                if (recordFocusEventer !== undefined) {
                    recordFocusEventer(undefined, oldSelectedRecordIndex);
                }
            }
        } else {
            const selection = selections[0];
            const rowIndex = selection.firstSelectedCell.y;
            const newFocusedRecordIndex = this._mainRecordAdapter.getRecordIndexFromRowIndex(rowIndex);
            if (newFocusedRecordIndex !== this._lastNotifiedFocusedRecordIndex) {
                const oldFocusedRecordIndex = this._lastNotifiedFocusedRecordIndex;
                this._lastNotifiedFocusedRecordIndex = newFocusedRecordIndex;
                const recordFocusEventer= this.recordFocusEventer;
                if (recordFocusEventer !== undefined) {
                    recordFocusEventer(newFocusedRecordIndex, oldFocusedRecordIndex);
                }
            }
        }

        return super.fireSyntheticSelectionChangedEvent(event);
    }

    override fireSyntheticGridResizedEvent(eventDetail: EventDetail.Resize): boolean {
        if (this.resizedEventer !== undefined) {
            this.resizedEventer(eventDetail);
        }

        return super.fireSyntheticGridResizedEvent(eventDetail);
    }

    override fireSyntheticColumnsViewWidthsChangedEvent(eventDetail: EventDetail.ColumnsViewWidthsChanged): boolean {
        if (this.columnsViewWidthsChangedEventer !== undefined) {
            this.columnsViewWidthsChangedEventer(eventDetail.fixedChanged, eventDetail.nonFixedChanged, eventDetail.activeChanged);
        }

        return super.fireSyntheticColumnsViewWidthsChangedEvent(eventDetail);
    }

    override fireSyntheticGridRenderedEvent(): boolean {
        if (this.renderedEventer !== undefined) {
            this.renderedEventer();
        }
        return super.fireSyntheticGridRenderedEvent();
    }

    // private handleHypegridNextRenderedEvent() {
    //     if (this._nextRenderedResolves.length > 0) {
    //         this.removeEventListener('hyg-grid-rendered', this._nextRenderedListener);
    //         const callbacks = this._nextRenderedResolves.slice();
    //         this._nextRenderedResolves.length = 0;
    //         for (const callback of callbacks) {
    //             callback();
    //         }
    //     }
    // }

    protected override processColumnListChanged(typeId: ListChangedTypeId, index: number, count: number, targetIndex: number) {
        // how to set initial width of a column
        switch (typeId) {
            case ListChangedTypeId.Insert:
            case ListChangedTypeId.Set:
                // use existing index and count to check for columns whose width is to be set
                break;
            case ListChangedTypeId.Move:
            case ListChangedTypeId.Remove:
            case ListChangedTypeId.Clear:
                // Do not check any columns
                index = 0;
                count = 0;
                break;
            default:
                throw new UnreachableCaseError('RCPCLC65599', typeId);
        }
        if (count > 0) {
            const allColumns = this.allColumns;
            const afterIndex = index + count;
            for (let allIndex = index; allIndex < afterIndex; allIndex++) {
                const column = allColumns[allIndex];
                if (column.name === this._strValGridField.name) {
                    column.setWidth(150);
                }
            }
        }

        super.processColumnListChanged(typeId, index, count, targetIndex);
    }

    private createGridPropertiesFromSettings(settings: Partial<GridSettings>): Partial<GridProperties> {
        const properties: Partial<GridProperties> = {};

        if (settings.fontFamily !== undefined) {
            if (settings.fontSize !== undefined) {
                const font = settings.fontSize + ' ' + settings.fontFamily;
                properties.font = font;
                properties.foregroundSelectionFont = font;
            }

            if (settings.columnHeaderFontSize !== undefined) {
                const font = settings.columnHeaderFontSize + ' ' + settings.fontFamily;
                properties.columnHeaderFont = font;
                properties.columnHeaderForegroundSelectionFont = font;
                properties.filterFont = font;
            }
        }

        if (settings.defaultRowHeight !== undefined) {
            properties.defaultRowHeight = settings.defaultRowHeight;
        }

        if (settings.cellPadding !== undefined) {
            properties.cellPadding = settings.cellPadding;
        }
        if (settings.fixedColumnCount !== undefined) {
            properties.fixedColumnCount = settings.fixedColumnCount;
        }
        if (settings.visibleColumnWidthAdjust !== undefined) {
            properties.visibleColumnWidthAdjust = settings.visibleColumnWidthAdjust;
        }
        if (settings.gridRightAligned !== undefined) {
            properties.gridRightAligned = settings.gridRightAligned;
        }

        if (settings.gridLinesH !== undefined) {
            properties.gridLinesH = settings.gridLinesH;
        }
        if (settings.gridLinesHWidth !== undefined) {
            properties.gridLinesHWidth = settings.gridLinesHWidth;
        }
        if (settings.gridLinesV !== undefined) {
            properties.gridLinesV = settings.gridLinesV;
        }
        if (settings.gridLinesVWidth !== undefined) {
            properties.gridLinesVWidth = settings.gridLinesVWidth;
        }

        if (settings.scrollHorizontallySmoothly !== undefined) {
            properties.scrollHorizontallySmoothly = settings.scrollHorizontallySmoothly;
        }

        const colorMap = settings.colorMap;
        if (colorMap !== undefined) {
            properties.backgroundColor = colorMap.backgroundColor;
            properties.color = colorMap.color;
            properties.columnHeaderBackgroundColor = colorMap.columnHeaderBackgroundColor;
            properties.columnHeaderColor = colorMap.columnHeaderColor;
            properties.backgroundSelectionColor = colorMap.backgroundSelectionColor;
            properties.foregroundSelectionColor = colorMap.foregroundSelectionColor;
            properties.columnHeaderBackgroundSelectionColor = colorMap.columnHeaderBackgroundSelectionColor;
            properties.columnHeaderForegroundSelectionColor = colorMap.columnHeaderForegroundSelectionColor;
            properties.selectionRegionOutlineColor = colorMap.selectionRegionOutlineColor;
            properties.gridLinesHColor = colorMap.gridLinesHColor;
            properties.gridLinesVColor = colorMap.gridLinesVColor;
            properties.fixedLinesHColor = colorMap.gridLinesHColor;
            properties.fixedLinesVColor = colorMap.gridLinesVColor;
            // uncomment below when row stripes are working
            // properties.rowStripes = [
            //     {
            //         backgroundColor: colorMap.bkgdBase,
            //     },
            //     {
            //         backgroundColor: colorMap.bkgdBaseAlt,
            //     }
            // ];
        }

        return properties;
    }

    private addFieldsToAdapter() {
        this._fieldAdapter.addFields([
            this._recordIndexGridField,
            this._hiddenStrValGridField,
            this._intValGridField,
            this._strValGridField,
            this._numberValGridField,
            this._dateValGridField,
            this._statusIdValGridField,
        ]);
    }

    private getColumnFieldIndex(activeColumnIndex: number): RevRecordFieldIndex {
        const column = this.getActiveColumn(activeColumnIndex);
        return column.index;
    }

    private getActiveColumnIndexUsingFieldIndex(fieldIndex: RevRecordFieldIndex): number {
        return this.getActiveColumnIndexByAllIndex(fieldIndex);
    }
}

export namespace RecordGrid {
    export type FieldNameToHeaderMap = Map<string, string | undefined>;

    export type ResizedEventDetail = EventDetail.Resize;

    export type CtrlKeyMouseMoveEventer = (this: void) => void;
    export type RecordFocusEventer = (this: void, newRecordIndex: RevRecordIndex | undefined, oldRecordIndex: RevRecordIndex | undefined) => void;
    export type RecordFocusClickEventer = (this: void, fieldIndex: RevRecordFieldIndex, recordIndex: RevRecordIndex) => void;
    export type RecordFocusDblClickEventer = (this: void, fieldIndex: RevRecordFieldIndex, recordIndex: RevRecordIndex) => void;
    export type ResizedEventer = (this: void, detail: ResizedEventDetail) => void;
    export type ColumnsViewWidthsChangedEventer = (this: void, fixedChanged: boolean, nonFixedChanged: boolean, allChanged: boolean) => void;
    export type RenderedEventer = (this: void/*, detail: Hypergrid.GridEventDetail*/) => void;
    export type FieldSortedEventer = (this: void) => void;
    export type ColumnWidthChangedEventer = (this: void, columnIndex: number) => void;
    export type SettingsApplyEventer = (this: void, settings: Partial<GridSettings>) => void;

    // export interface LayoutWithHeadersMap {
    //     layout: GridLayout;
    //     headersMap: FieldNameToHeaderMap;
    // }

    /** Defines the display details of a Field */
    export interface FieldState {
        /** Determines the header text of a Field. Undefined to use the raw field name */
        header?: string;
        /** Determines the width of a Field. Undefined to auto-size */
        width?: number;
        /** The text alignment within a cell */
        alignment?: Halign;
    }

    export type RenderedCallback = (this: void) => void;
}

