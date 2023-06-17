import {
    CellPainter,
    DatalessSubgrid,
    EventDetail,
    GridSettings,
    ListChangedTypeId,
    RevRecordField,
    RevRecordFieldIndex,
    RevRecordIndex,
    RevRecordMainDataServer,
    RevRecordSchemaServer,
    RevRecordStore,
    Revgrid,
    UnreachableCaseError
} from '..';
import { AppBehavioredColumnSettings } from './app-behaviored-column-settings';
import { AppBehavioredGridSettings } from './app-behaviored-grid-settings';
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
import { HeaderDataServer } from './header-data-server';

export class RecordGrid extends Revgrid<
        AppBehavioredGridSettings,
        AppBehavioredColumnSettings,
        GridField
    > {
    fieldSortedEventer: RecordGrid.FieldSortedEventer | undefined;
    columnWidthChangedEventer: RecordGrid.ColumnWidthChangedEventer | undefined;

    recordFocusEventer: RecordGrid.RecordFocusEventer | undefined;
    recordFocusClickEventer: RecordGrid.RecordFocusClickEventer | undefined;
    recordFocusDblClickEventer: RecordGrid.RecordFocusDblClickEventer | undefined;
    resizedEventer: RecordGrid.ResizedEventer | undefined;
    columnsViewWidthsChangedEventer: RecordGrid.ColumnsViewWidthsChangedEventer | undefined;
    renderedEventer: RecordGrid.RenderedEventer | undefined;

    private _lastNotifiedFocusedRecordIndex: number | undefined;

    private readonly _schemaServer: RevRecordSchemaServer<AppBehavioredColumnSettings, GridField>;
    private readonly _headerDataServer: HeaderDataServer;
    private readonly _mainDataServer: RevRecordMainDataServer<AppBehavioredColumnSettings, GridField>;

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
        gridSettings: GridSettings,
    ) {
        const schemaServer = new RevRecordSchemaServer<AppBehavioredColumnSettings, GridField>();
        const mainDataServer = new RevRecordMainDataServer<AppBehavioredColumnSettings, GridField>(schemaServer, recordStore);
        const headerDataServer = new HeaderDataServer();

        const recordCellAdapter = new RevRecordCellAdapter(mainDataServer, mainCellPainter);

        const definition: Revgrid.Definition<StandardInMemoryBehavioredColumnSettings, GridField> = {
            schemaServer: schemaServer,
            subgrids: [
                {
                    role: DatalessSubgrid.RoleEnum.header,
                    dataServer: headerDataServer,
                    cellModel: header
                },
                {
                    role: DatalessSubgrid.RoleEnum.main,
                    dataServer: mainDataServer,
                    cellModel: recordCellAdapter,
                }
            ],
        };

        super(gridElement, definition);

        this._schemaServer = schemaServer;
        this._headerDataServer = headerDataServer;
        this._mainDataServer = mainDataServer;

        this.allowEvents(true);

        this.addFieldsToAdapter();
    }

    get fieldCount(): number { return this._schemaServer.fieldCount; }

    get strValGridField() { return this._strValGridField; }
    get hiddenStrValGridField() { return this._hiddenStrValGridField; }

    get sortable(): boolean { return this.settings.mouseSortable; }
    set sortable(value: boolean) { this.settings.mouseSortable = value; }

    get columnCount(): number { return this.activeColumnCount; }

    get continuousFiltering(): boolean { return this._mainDataServer.continuousFiltering; }
    set continuousFiltering(value: boolean) { this._mainDataServer.continuousFiltering = value}

    get filterCallback(): RevRecordMainDataServer.RecordFilterCallback | undefined { return this._mainDataServer.filterCallback; }
    set filterCallback(value: RevRecordMainDataServer.RecordFilterCallback | undefined) { this._mainDataServer.filterCallback = value}

    get rowOrderReversed(): boolean { return this._mainDataServer.rowOrderReversed; }
    set rowOrderReversed(value: boolean) { this._mainDataServer.rowOrderReversed = value}

    // get fieldCount(): number { return this._fieldAdapter.fieldCount; }

    get focusedRecordIndex(): RevRecordIndex | undefined {
        const rectangles = this.getSelectedRectangles();

        if (rectangles.length === 0) {
            return undefined;
        } else {
            const rowIndex = rectangles[0].firstSelectedCell.y;
            return this._mainDataServer.getRecordIndexFromRowIndex(rowIndex)
        }
    }

    set focusedRecordIndex(recordIndex: number | undefined) {
        if (recordIndex === undefined) {
            this.clearSelection();
        } else {
            const rowIndex = this._mainDataServer.getRowIndexFromRecordIndex(recordIndex);

            if (rowIndex === undefined) {
                this.clearSelection();
            } else {
                this.selectRows(rowIndex, rowIndex, undefined, undefined);
            }
        }
    }

    get headerRowCount(): number {
        return this._headerDataServer.getRowCount();
    }

    get isFiltered(): boolean { return this._mainDataServer.isFiltered; }
    get sortColumns(): number { return this._mainDataServer.sortColumnCount; }

    get gridRightAligned(): boolean { return this.settings.gridRightAligned; }
    get rowHeight(): number { return this.settings.defaultRowHeight; }

    get rowRecIndices(): number[] {
        return [];
        // todo
    }

    setRecentDurations(allChanged: number, recordInserted: number, recordUpdated: number, valueChanged: number): void {
        this._mainDataServer.allChangedRecentDuration = allChanged;
        this._mainDataServer.recordInsertedRecentDuration = recordInserted;
        this._mainDataServer.recordUpdatedRecentDuration = recordUpdated;
        this._mainDataServer.valueChangedRecentDuration = valueChanged;
    }

    autoSizeColumnWidth(columnIndex: number): void {
        this.autoSizeColumnWidth(columnIndex);
    }

    autoSizeFieldColumnWidth(field: RevRecordField): void {
        const fieldIndex = this._schemaServer.getFieldIndex(field);
        const columnIndex = this.getActiveColumnIndexUsingFieldIndex(fieldIndex);

        if (columnIndex < 0) {
            throw new RangeError('Field is not visible');
        }

        this.autoSizeColumnWidth(columnIndex);
    }

    getField(fieldIdx: number) {
        return this._schemaServer.getField(fieldIdx) as GridField;
    }

    getFieldIndex(field: GridField): RevRecordFieldIndex {
        return this._schemaServer.getFieldIndex(field);
    }

    getFieldWidth(field: RevRecordFieldIndex | GridField): number | undefined {
        const fieldIndex = typeof field === 'number' ? field : this.getFieldIndex(field);
        const column = this.getAllColumn(fieldIndex);

        return column.autosizing ? undefined : column.width;
    }

    getFieldVisible(field: RevRecordFieldIndex | RevRecordField): boolean {
        const fieldIndex = typeof field === 'number' ? field : this.getFieldIndex(field);
        const activeColumns = this.getActiveColumns();
        return activeColumns.findIndex(column => column.field.index === fieldIndex) !== -1;
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
        return this.getActiveColumns().map(column => column.field.index);
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
            throw new Error(`Move Field Error: ${fieldIndex}, ${this._schemaServer.getField(fieldIndex).name}`);
        }

        this.moveActiveColumn(fromColumnIndex, toColumnIndex);
    }

    recordToRowIndex(recordIndex: RevRecordIndex): number {
        const rowIndex = this._mainDataServer.getRowIndexFromRecordIndex(recordIndex);
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
        const recIdx = this._mainDataServer.getRecordIndexFromRowIndex(rowIndex);
        if (recIdx === undefined) {
            throw new Error(`RowToRecordIndex ${rowIndex}`);
        } else {
            return recIdx;
        }
    }

    setFieldHeading(field: GridField, heading: string): void {
        field.heading = heading;
        const fieldIndex = this.getFieldIndex(field);
        this._headerDataServer.invalidateCell(fieldIndex);
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
        const fieldIndex = column.field.index;

        this._mainDataServer.sortBy(fieldIndex);

        return super.fireSyntheticColumnSortEvent(eventDetail);
    }

    override fireSyntheticClickEvent(event: CellEvent): boolean {
        const gridY = event.gridCell.y;
        if (gridY !== 0) { // Skip clicks to the column headers
            if (this.recordFocusClickEventer !== undefined) {
                const rowIndex = event.dataCell.y;
                const recordIndex = this._mainDataServer.getRecordIndexFromRowIndex(rowIndex);
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
                const recordIndex = this._mainDataServer.getRecordIndexFromRowIndex(rowIndex);
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
        const rectangles = event.getSelectedRectangles();

        if (rectangles.length === 0) {
            if (this._lastNotifiedFocusedRecordIndex !== undefined) {
                const oldSelectedRecordIndex = this._lastNotifiedFocusedRecordIndex;
                this._lastNotifiedFocusedRecordIndex = undefined;
                const recordFocusEventer = this.recordFocusEventer;
                if (recordFocusEventer !== undefined) {
                    recordFocusEventer(undefined, oldSelectedRecordIndex);
                }
            }
        } else {
            const rectangle = rectangles[0];
            const rowIndex = rectangle.firstSelectedCell.y;
            const newFocusedRecordIndex = this._mainDataServer.getRecordIndexFromRowIndex(rowIndex);
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

    protected override processAllColumnListChanged(typeId: ListChangedTypeId, index: number, count: number, targetIndex: number) {
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

        super.processAllColumnListChanged(typeId, index, count, targetIndex);
    }

    private createGridPropertiesFromSettings(settings: Partial<RecordGridSettings>): Partial<GridSettings> {
        const properties: Partial<GridSettings> = {};

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
        this._schemaServer.addFields([
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
    export type SettingsApplyEventer = (this: void, settings: Partial<RecordGridSettings>) => void;

    // export interface LayoutWithHeadersMap {
    //     layout: GridLayout;
    //     headersMap: FieldNameToHeaderMap;
    // }

    export type RenderedCallback = (this: void) => void;
}

