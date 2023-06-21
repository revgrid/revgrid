import {
    CellEditor,
    DatalessSubgrid,
    DatalessViewCell,
    Point,
    RevRecordMainDataServer,
    RevRecordSchemaServer,
    Revgrid,
    StandardBehavioredColumnSettings,
    StandardHeaderTextCellPainter,
    Subgrid,
    ViewCell,
    readonlyDefaultStandardBehavioredColumnSettings
} from '..';
import { AppAllGridSettings } from './app-all-grid-settings';
import { AppBehavioredGridSettings } from './app-behaviored-grid-settings';
import { Controls } from './controls';
import { defaultAppAllGridSettings } from './default-app-all-grid-settings';
import {
    DateValGridField,
    GridField, HiddenStrValGridField, IntValGridField, NumberValGridField, RecordIndexGridField, StatusIdValGridField, StrValGridField
} from './grid-field';
import { HeaderDataServer } from './header-data-server';
import { InMemoryAppBehavioredGridSettings } from './in-memory-app-behaviored-grid-settings';
import { MainCellPainter } from './main-cell-painter';
import { RecordGrid } from './record-grid';
import { RecordStore } from './record-store';

export class Main {
    private readonly _gridHostElement: HTMLElement;

    // private readonly _fieldAdapter = new RevRecordFieldAdapter();
    // private readonly _headerRecordAdapter = new RevRecordHeaderAdapter();
    // private readonly _mainRecordAdapter: RevRecordMainAdapter;

    private readonly _recordStore: RecordStore;
    private readonly _schemaServer: RevRecordSchemaServer<StandardBehavioredColumnSettings, GridField>;
    private readonly _headerDataServer: HeaderDataServer;
    private readonly _mainDataServer: RevRecordMainDataServer<StandardBehavioredColumnSettings, GridField>;

    private readonly _mainCellPainter: MainCellPainter;
    private readonly _headerCellPainter: StandardHeaderTextCellPainter<AppBehavioredGridSettings, StandardBehavioredColumnSettings, GridField>;

    private readonly _recordIndexGridField = new RecordIndexGridField(readonlyDefaultStandardBehavioredColumnSettings);
    private readonly _hiddenStrValGridField = new HiddenStrValGridField(readonlyDefaultStandardBehavioredColumnSettings);
    private readonly _intValGridField = new IntValGridField(readonlyDefaultStandardBehavioredColumnSettings);
    private readonly _strValGridField = new StrValGridField(readonlyDefaultStandardBehavioredColumnSettings);
    private readonly _numberValGridField = new NumberValGridField(readonlyDefaultStandardBehavioredColumnSettings);
    private readonly _dateValGridField = new DateValGridField(readonlyDefaultStandardBehavioredColumnSettings);
    private readonly _statusIdValGridField = new StatusIdValGridField(readonlyDefaultStandardBehavioredColumnSettings);

    private readonly _grid: RecordGrid;
    private readonly _gridSettings: InMemoryAppBehavioredGridSettings = new InMemoryAppBehavioredGridSettings();
    private readonly _debugEnabled = true;

    private readonly _controls: Controls;

    // private readonly _ctrlKeyMousemoveListener = (event: MouseEvent) => this.handleHypegridCtrlKeyMousemoveEvent(event.ctrlKey);

    constructor() {
        const gridHostElement = document.querySelector('#gridHost') as HTMLElement;
        if (gridHostElement === null) {
            throw new Error('gridHost not found');
        }
        this._gridHostElement = gridHostElement;

        const initialSettings: AppAllGridSettings = {
            ...defaultAppAllGridSettings,
            horizontalGridLinesWidth: 0,
            fixedColumnCount: 1,

            font: 'Tahoma, Geneva, sans-serif 13px',
            columnHeaderFont: 'Tahoma, Geneva, sans-serif 12px',

            backgroundColor: backgroundColor,
            color: foregroundColor,

            columnHeaderBackgroundColor: columnHeaderBackgroundColor,
            columnHeaderForegroundColor: columnHeaderForegroundColor,
            selectionForegroundColor: backgroundColor,
            selectionBackgroundColor: foregroundColor,
            selectionRegionOutlineColor: '#D3D3D1',
            verticalGridLinesColor: '#595959',
            horizontalGridLinesColor: '#595959',
            alternateBackgroundColor: '#2b2b2b',
            grayedOutForegroundColor: '#595959',
            focusedRowBackgroundColor: '#6e6835',
            focusedRowBorderColor: '#C8B900',

            valueRecentlyModifiedBorderColor: '#8C5F46',
            valueRecentlyModifiedUpBorderColor: '#4646FF',
            valueRecentlyModifiedDownBorderColor: '#64FA64',
            recordRecentlyUpdatedBorderColor: 'orange',
            recordRecentlyInsertedBorderColor: 'pink',
        };
        this._gridSettings.merge(initialSettings);

        this._recordStore = new RecordStore();

        this._schemaServer = new RevRecordSchemaServer<StandardBehavioredColumnSettings, GridField>();
        this._mainDataServer = new RevRecordMainDataServer<StandardBehavioredColumnSettings, GridField>(this._schemaServer, this._recordStore);
        this._headerDataServer = new HeaderDataServer();


        const definition: Revgrid.Definition<StandardBehavioredColumnSettings, GridField> = {
            schemaServer: this._schemaServer,
            subgrids: [
                {
                    role: DatalessSubgrid.RoleEnum.header,
                    dataServer: this._headerDataServer,
                    getCellPainterEventer: (viewCell) => this.getHeaderCellPainter(viewCell),
                },
                {
                    role: DatalessSubgrid.RoleEnum.main,
                    dataServer: this._mainDataServer,
                    getCellPainterEventer: (viewCell) => this.getMainCellPainter(viewCell),
                }
            ],
        };

        this._grid = new RecordGrid(this._gridHostElement, definition, this._gridSettings);

        const grid = this._grid;

        this._mainCellPainter = new MainCellPainter(grid, this._mainDataServer);
        this._headerCellPainter = new StandardHeaderTextCellPainter<AppBehavioredGridSettings, StandardBehavioredColumnSettings, GridField>(grid, this._headerDataServer);

        grid.focusChangedEventer = (newPoint, oldPoint) => this.handleFocusChanged(newPoint, oldPoint)
        grid.cellClickEventer = (cell) => this.handleCellFocusClick(cell);
        grid.cellDblClickEventer = (cell) => this.handleRecordFocusDblClick(cell);
        grid.columnSortEventer = (headerOrFixedRowCell) => this.handleColumnSort(headerOrFixedRowCell);

        this._controls = new Controls(
            grid,
            this._gridSettings,
            this._recordStore,
            this._schemaServer,
            this._mainDataServer,
            this._recordIndexGridField,
            this._intValGridField,
            this._strValGridField,
            this._debugEnabled
        );

        grid.allowEvents(true);

        this._schemaServer.addFields([
            this._recordIndexGridField,
            this._hiddenStrValGridField,
            this._intValGridField,
            this._strValGridField,
            this._numberValGridField,
            this._dateValGridField,
            this._statusIdValGridField,
        ]);

        // grid.canvas.canvas.addEventListener('mousemove', this._ctrlKeyMousemoveListener);
    }

    start(): void {
        // no code needed
    }

    // private numberToPixels(value: number): string {
    //     return value.toString(10) + 'px';
    // }

    // private handleHypegridCtrlKeyMousemoveEvent(ctrlKey: boolean) {
    //     if (ctrlKey) {
    //         if (this._scrollbarThumbInactiveOpaqueSetTimeoutId !== undefined) {
    //             this._scrollbarThumbInactiveOpaqueExtended = true;
    //         } else {
    //             this.temporarilySetScrollbarThumbInactiveOpaque();
    //         }
    //     }
    // }

    // Event Handlers

    // OnFocusedCellChange(newFieldIndex: GridFieldIndex, oldFieldIndex: GridFieldIndex, newRecordIndex: GridRecordIndex,
    // 	oldRecordIndex: GridRecordIndex, uiEvent: boolean): void {
    // 	this.UpdateCaptionValue(newRecordIndex);

    // 	const RowIndexFieldIndex = this._grid.GegridFieldIndex(AppComponent.FieldRowIndex);

    // 	if (oldRecordIndex >= 0) {
    // 		this._grid.InvalidateValue(RowIndexFieldIndex, oldRecordIndex);
    // 	}

    // 	if (newRecordIndex >= 0) {
    // 		this._grid.InvalidateValue(RowIndexFieldIndex, newRecordIndex);
    // 	}
    // }


    // private updateScrollbar() {
    //     const settings = this._settings;
    //     // this._grid1HostElement.style.setProperty(CssVar.scrollbarThumbColor, colorSettings.getFore(settings.scrollbar));
    //     // this._grid1HostElement.style.setProperty(CssVar.scrollbarThumbShadowColor, colors.scrollbarThumbShadowColor);
    //     this._gridHostElement.style.setProperty(CssVar.scrollbarHorizontalHeight, this.numberToPixels(settings.scrollbarHorizontalHeight));
    //     this._gridHostElement.style.setProperty(CssVar.scrollbarHorizontalThumbHeight, this.numberToPixels(settings.scrollbarHorizontalThumbHeight));
    //     this._gridHostElement.style.setProperty(CssVar.scrollbarVerticalWidth, this.numberToPixels(settings.scrollbarVerticalWidth));
    //     this._gridHostElement.style.setProperty(CssVar.scrollbarVerticalThumbWidth, this.numberToPixels(settings.scrollbarVerticalThumbWidth));

    //     this._gridHostElement.style.setProperty(CssVar.scrollbarMargin, this.numberToPixels(settings.scrollbarMargin));

    //     this._gridHostElement.style.setProperty(CssVar.scrollbarThumbInactiveOpacity, settings.scrollbarThumbInactiveOpacity.toString());

    //     if (settings.gridRightAligned) {
    //         this._gridHostElement.style.setProperty(CssVar.scrollbarVerticalLeft, 'revert');
    //         this._gridHostElement.style.setProperty(CssVar.scrollbarVerticalRight, 'null');
    //     } else {
    //         this._gridHostElement.style.setProperty(CssVar.scrollbarVerticalLeft, 'null');
    //         this._gridHostElement.style.setProperty(CssVar.scrollbarVerticalRight, 'revert');
    //     }
    // }

    // private temporarilySetScrollbarThumbInactiveOpaque() {
    //     this._gridHostElement.style.setProperty(CssVar.scrollbarThumbInactiveOpacity, '1');
    //     this._scrollbarThumbInactiveOpaqueSetTimeoutId = setTimeout(() => {
    //         this._scrollbarThumbInactiveOpaqueSetTimeoutId = undefined;
    //         if (this._scrollbarThumbInactiveOpaqueExtended) {
    //             this._scrollbarThumbInactiveOpaqueExtended = false;
    //             this.temporarilySetScrollbarThumbInactiveOpaque();
    //         } else {
    //             this._gridHostElement.style.setProperty(CssVar.scrollbarThumbInactiveOpacity, 'revert');
    //         }
    //     }, 250);
    // }


    private getMainCellPainter(_viewCell: DatalessViewCell<StandardBehavioredColumnSettings, GridField>) {
        return this._mainCellPainter;
    }

    private getHeaderCellPainter(_viewCell: DatalessViewCell<StandardBehavioredColumnSettings, GridField>) {
        return this._headerCellPainter;
    }

    private getCellEditor(
        field: GridField,
        _subgridRowIndex: number,
        _subgrid: Subgrid<StandardBehavioredColumnSettings, GridField>,
        readonly: boolean,
        _viewCell: ViewCell<StandardBehavioredColumnSettings, GridField> | undefined
    ): CellEditor<StandardBehavioredColumnSettings, GridField> | undefined {
        return this.tryGetCellEditor(field.name, readonly);
    }

    private tryGetCellEditor(columnName: string, readonly: boolean): CellEditor<StandardBehavioredColumnSettings, GridField> | undefined {
        const editor = this.tryCreateCellEditor(columnName);
        if (editor !== undefined) {
            editor.readonly = readonly;
        }
        return editor;
    }

    private tryCreateCellEditor(columnName: string): CellEditor<StandardBehavioredColumnSettings, GridField> | undefined {
        return undefined;
        // switch (columnName) {
        //     case 'favoriteFood': return this._textInputEditor;
        //     case 'restrictMovement': return this._checkboxEditor;
        //     default: return undefined;
        // }
    }

    private handleFocusChanged(newPoint: Point | undefined, oldPoint: Point | undefined): void {
        const newText = newPoint === undefined ? '()' : `(${newPoint.x}, ${newPoint.y})`;
        const oldText = oldPoint === undefined ? '()' : `(${oldPoint.x}, ${oldPoint.y})`;
        console.log(`Focus for Record: New: ${newText} Old: ${oldText}`);
    }

    private handleCellFocusClick(cell: ViewCell<StandardBehavioredColumnSettings, GridField>): void {
        if (cell.isHeader) {
            console.log(`Click for Header in field ${cell.viewLayoutColumn.column.field.name}`);
        } else {
            if (cell.isMain) {
                const recordIndex = this._mainDataServer.getRecordIndexFromRowIndex(cell.viewLayoutRow.subgridRowIndex);
                console.log(`Click for Record ${recordIndex} field ${cell.viewLayoutColumn.column.field.name}`);
            } else {
                throw new Error('Click in unknown subgrid');
            }
        }
    }

    private handleRecordFocusDblClick(cell: ViewCell<StandardBehavioredColumnSettings, GridField>): void {
        if (cell.isHeader) {
            console.log(`Double click for Header in field ${cell.viewLayoutColumn.column.field.name}`);
        } else {
            if (cell.isMain) {
                const recordIndex = this._mainDataServer.getRecordIndexFromRowIndex(cell.viewLayoutRow.subgridRowIndex);
                console.log(`Double click for Record ${recordIndex} field ${cell.viewLayoutColumn.column.field.name}`);
            } else {
                throw new Error('Double click in unknown subgrid');
            }
        }
    }

    private handleColumnSort(headerOrFixedRowCell: ViewCell<StandardBehavioredColumnSettings, GridField>) {
        this._mainDataServer.sortBy(headerOrFixedRowCell.viewLayoutColumn.column.field.index);
    }
}

// namespace CssVar {
//     export const scrollbarThumbColor = '--scrollbar-thumb-color';
//     export const scrollbarThumbInactiveOpacity = '--scrollbar-thumb-inactive-opacity';
//     export const scrollbarVerticalLeft = '--scrollbar-vertical-left';
//     export const scrollbarVerticalRight = '--scrollbar-vertical-right';
//     export const scrollbarVerticalWidth = '--scrollbar-vertical-width';
//     export const scrollbarVerticalThumbWidth = '--scrollbar-vertical-thumb-width';
//     export const scrollbarHorizontalTop = '--scrollbar-horizontal-top';
//     export const scrollbarHorizontalBottom = '--scrollbar-horizontal-bottom';
//     export const scrollbarHorizontalHeight = '--scrollbar-horizontal-height';
//     export const scrollbarHorizontalThumbHeight = '--scrollbar-horizontal-thumb-height';
//     export const scrollbarMargin = '--scrollbar-margin';
// }

// const backgroundColor = '#212121';
// const foregroundColor = '#f9f0f0';
// const columnHeaderBackgroundColor = '#626262';
// const columnHeaderForegroundColor = 'white';

// const colorMap: RecordGridSettings.ColorMap = {
//     // Grid colors
//     backgroundColor: backgroundColor,
//     color: foregroundColor,
//     bkgdBaseAlt: '#2b2b2b',
//     columnHeaderBackgroundColor: columnHeaderBackgroundColor,
//     columnHeaderColor: columnHeaderForegroundColor,
//     backgroundSelectionColor: backgroundColor,
//     foregroundSelectionColor: foregroundColor,
//     columnHeaderBackgroundSelectionColor: columnHeaderBackgroundColor,
//     columnHeaderForegroundSelectionColor: columnHeaderForegroundColor,
//     selectionRegionOutlineColor: '#D3D3D1',
//     gridLinesVColor: '#595959',
//     gridLinesHColor: '#595959',

//     // Extra colors in painter
//     bkgdGreyedOut: backgroundColor,
//     foreGreyedOut: '#595959',
//     bkgdFocusedRow: '#6e6835',
//     bkgdFocusedRowBorder: '#C8B900',
//     foreValueRecentlyModifiedBorder: '#8C5F46',
//     foreValueRecentlyModifiedDownBorder: '#4646FF',
//     foreValueRecentlyModifiedUpBorder: '#64FA64',
//     foreRecordRecentlyUpdatedBorder: 'orange',
//     foreRecordRecentlyInsertedBorder: 'pink',

//     // Scrollbar colors
//     foreScrollbarThumbColor: '#d3d3d3',
//     scrollbarThumbShadowColor: 'black',
// };

// const defaultGridSettings: RecordGridSettings = {
//     fontFamily: 'Tahoma, Geneva, sans-serif',
//     fontSize: '13px',
//     columnHeaderFontSize: '12px',
//     defaultRowHeight: defaultGridProperties.defaultRowHeight,

//     cellPadding: defaultGridProperties.cellPadding,
//     fixedColumnCount: 1,
//     scrollHorizontallySmoothly: defaultGridProperties.scrollHorizontallySmoothly,
//     visibleColumnWidthAdjust: defaultGridProperties.visibleColumnWidthAdjust,
//     gridRightAligned: defaultGridProperties.gridRightAligned,

//     gridLinesH: defaultGridProperties.gridLinesH,
//     gridLinesV: defaultGridProperties.gridLinesV,
//     gridLinesHWidth: defaultGridProperties.gridLinesHWidth,
//     gridLinesVWidth: defaultGridProperties.gridLinesVWidth,

//     scrollbarHorizontalHeight: 11,
//     scrollbarHorizontalThumbHeight: 7,
//     scrollbarVerticalWidth: 11,
//     scrollbarVerticalThumbWidth: 7,
//     scrollbarThumbInactiveOpacity: 0.4,
//     scrollbarMargin: 1,

//     allChangedRecentDuration: 250,
//     recordInsertedRecentDuration: 1000,
//     recordUpdatedRecentDuration: 1000,
//     valueChangedRecentDuration: 1000,

//     colorMap,
// }

const backgroundColor = '#212121';
const foregroundColor = '#f9f0f0';
const columnHeaderBackgroundColor = '#626262';
const columnHeaderForegroundColor = 'white';

