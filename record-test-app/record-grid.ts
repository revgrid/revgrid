import {
    EventDetail,
    GridSettings,
    LinedHoverCell,
    ListChangedTypeId,
    Point,
    RevRecordField,
    RevRecordFieldIndex,
    RevRecordIndex,
    Revgrid,
    StandardBehavioredColumnSettings,
    ViewCell
} from '..';
import { AppBehavioredGridSettings } from './app-behaviored-grid-settings';
import {
    GridField
} from './grid-field';

export class RecordGrid extends Revgrid<
        AppBehavioredGridSettings,
        StandardBehavioredColumnSettings,
        GridField
    > {
    fieldSortedEventer: RecordGrid.FieldSortedEventer | undefined;
    columnWidthChangedEventer: RecordGrid.ColumnWidthChangedEventer | undefined;

    focusChangedEventer: RecordGrid.FocusChangedEventer | undefined;
    cellClickEventer: RecordGrid.CellClickEventer | undefined;
    cellDblClickEventer: RecordGrid.CellDblClickEventer | undefined;
    resizedEventer: RecordGrid.ResizedEventer | undefined;
    fieldColumnListChanged: RecordGrid.FieldColumnListChanged | undefined;
    columnsViewWidthsChangedEventer: RecordGrid.ColumnsViewWidthsChangedEventer | undefined;
    renderedEventer: RecordGrid.RenderedEventer | undefined;

    private _lastNotifiedFocusedRecordIndex: number | undefined;

    // constructor(
    //     gridElement: HTMLElement,
    //     recordStore: RevRecordStore,
    //     mainCellPainter: CellPainter,
    //     gridSettings: GridSettings,
    // ) {
    //     super(gridElement, definition, settings)
    // }

    get columnCount(): number { return this.activeColumnCount; }

    getField(fieldIdx: number) {
        return this._schemaServer.getField(fieldIdx) as GridField;
    }

    getFieldIndex(field: GridField): RevRecordFieldIndex {
        return this._schemaServer.getFieldIndex(field);
    }

    getFieldWidth(field: RevRecordFieldIndex | GridField): number | undefined {
        const fieldIndex = typeof field === 'number' ? field : this.getFieldIndex(field);
        const column = this.getAllColumn(fieldIndex);

        return column.autoSizing ? undefined : column.width;
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
            column.checkColumnAutoSizing(true);
        } else {
            column.setWidth(width);
        }

        // Update Hypergrid schema
        // if (this.updateCounter == 0 && this.dispatchEvent !== undefined)
        // 	this.dispatchEvent('fin-hypergrid-schema-loaded');
    }

    setFieldVisible(field: RevRecordFieldIndex | RevRecordField<StandardBehavioredColumnSettings>, visible: boolean): void {
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

    protected override descendantProcessClick(event: MouseEvent, hoverCell: LinedHoverCell<StandardBehavioredColumnSettings, GridField> | null | undefined) {
        if (hoverCell === undefined) {
            hoverCell = this.viewLayout.findLinedHoverCell(event.offsetX, event.offsetY);
        }

        if (hoverCell !== null && hoverCell !== undefined) {
            if (!LinedHoverCell.isMouseOverLine(hoverCell) && this.cellClickEventer !== undefined) {
                const viewCell = hoverCell.viewCell;
                this.cellClickEventer(viewCell);
            }
        }
    }

    protected override descendantProcessDblClick(event: MouseEvent, hoverCell: LinedHoverCell<StandardBehavioredColumnSettings, GridField> | null | undefined) {
        if (hoverCell === undefined) {
            hoverCell = this.viewLayout.findLinedHoverCell(event.offsetX, event.offsetY);
        }

        if (hoverCell !== null && hoverCell !== undefined) {
            if (!LinedHoverCell.isMouseOverLine(hoverCell) && this.cellDblClickEventer !== undefined) {
                const viewCell = hoverCell.viewCell;
                this.cellDblClickEventer(viewCell);
            }
        }
    }

    protected override descendantProcessCellFocusChanged(newPoint: Point | undefined, oldPoint: Point | undefined) {
        if (this.focusChangedEventer !== undefined) {
            this.focusChangedEventer(newPoint, oldPoint);
        }
    }

    protected override descendantProcessResized() {
        if (this.resizedEventer !== undefined) {
            this.resizedEventer();
        }
    }

    protected override descendantProcessColumnsViewWidthsChanged() {
        if (this.columnsViewWidthsChangedEventer !== undefined) {
            this.columnsViewWidthsChangedEventer();
        }
    }

    protected override descendantProcessRendered() {
        if (this.renderedEventer !== undefined) {
            this.renderedEventer();
        }
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

    private getActiveColumnIndexUsingFieldIndex(fieldIndex: RevRecordFieldIndex): number {
        return this.getActiveColumnIndexByAllIndex(fieldIndex);
    }
}

export namespace RecordGrid {
    export type FieldNameToHeaderMap = Map<string, string | undefined>;

    export type CtrlKeyMouseMoveEventer = (this: void) => void;
    export type FocusChangedEventer = (this: void, newFocusPoint: Point | undefined, oldFocusPoint: Point | undefined) => void;
    export type CellClickEventer = (this: void, viewCell: ViewCell<StandardBehavioredColumnSettings, GridField>) => void;
    export type CellDblClickEventer = (this: void, viewCell: ViewCell<StandardBehavioredColumnSettings, GridField>) => void;
    export type ResizedEventer = (this: void) => void;
    export type ColumnsViewWidthsChangedEventer = (this: void) => void;
    export type RenderedEventer = (this: void/*, detail: Hypergrid.GridEventDetail*/) => void;
    export type FieldSortedEventer = (this: void) => void;
    export type ColumnWidthChangedEventer = (this: void, columnIndex: number) => void;
    export type FieldColumnListChanged = (typeId: ListChangedTypeId, index: number, count: number, targetIndex: number) => void;
    export type SettingsApplyEventer = (this: void, settings: Partial<RecordGridSettings>) => void;

    // export interface LayoutWithHeadersMap {
    //     layout: GridLayout;
    //     headersMap: FieldNameToHeaderMap;
    // }

    export type RenderedCallback = (this: void) => void;
}

