/* eslint-disable @typescript-eslint/non-nullable-type-assertion-style */
import {
    RevGridDefinition,
    RevGridOptions,
    RevPoint,
    RevRecordDataServer,
    RevRecordSchemaServer,
    RevSimpleBehavioredColumnSettings,
    RevSimpleInMemoryBehavioredColumnSettings,
    RevSingleHeadingDataServer,
    RevStandardHeaderTextCellPainter,
    RevSubgrid,
    RevViewCell,
    revSimpleReadonlyDefaultBehavioredColumnSettings
} from '../..';
import { AppBehavioredGridSettings } from './app-behaviored-grid-settings';
import { AppGridSettings } from './app-grid-settings';
import { Controls } from './controls';
import { defaultAppGridSettings } from './default-app-grid-settings';
import {
    DateValGridField,
    GridField, HiddenStrValGridField, IntValGridField, NumberValGridField, RecordIndexGridField, StatusIdValGridField, StrValGridField
} from './grid-field';
import { InMemoryAppBehavioredGridSettings } from './in-memory-app-behaviored-grid-settings';
import { MainCellPainter } from './main-cell-painter';
import { RecordGrid } from './record-grid';
import { RecordStore } from './record-store';

export class Main {
    private readonly _gridHostElement: HTMLElement;

    private readonly _recordStore: RecordStore;
    private readonly _schemaServer: RevRecordSchemaServer<GridField>;
    private readonly _headerDataServer: RevSingleHeadingDataServer<GridField>;
    private readonly _mainDataServer: RevRecordDataServer<GridField>;

    private readonly _mainCellPainter: MainCellPainter;
    private readonly _headerCellPainter: RevStandardHeaderTextCellPainter<AppBehavioredGridSettings, RevSimpleBehavioredColumnSettings, GridField>;

    private readonly _recordIndexGridField = new RecordIndexGridField(revSimpleReadonlyDefaultBehavioredColumnSettings);
    private readonly _hiddenStrValGridField = new HiddenStrValGridField(revSimpleReadonlyDefaultBehavioredColumnSettings);
    private readonly _intValGridField = new IntValGridField(revSimpleReadonlyDefaultBehavioredColumnSettings);
    private readonly _strValGridField = new StrValGridField(revSimpleReadonlyDefaultBehavioredColumnSettings);
    private readonly _numberValGridField = new NumberValGridField(revSimpleReadonlyDefaultBehavioredColumnSettings);
    private readonly _dateValGridField = new DateValGridField(revSimpleReadonlyDefaultBehavioredColumnSettings);
    private readonly _statusIdValGridField = new StatusIdValGridField(revSimpleReadonlyDefaultBehavioredColumnSettings);

    private readonly _grid: RecordGrid;
    private readonly _gridSettings: InMemoryAppBehavioredGridSettings = new InMemoryAppBehavioredGridSettings();
    private readonly _debugEnabled = true;

    private readonly _controls: Controls;

    constructor() {
        const gridHostElement = document.querySelector('#gridHost') as HTMLElement;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (gridHostElement === null) {
            throw new Error('gridHost not found');
        }
        this._gridHostElement = gridHostElement;

        const initialSettings: AppGridSettings = {
            ...defaultAppGridSettings,
            horizontalGridLinesWidth: 0,
            fixedColumnCount: 1,

            font: 'Tahoma, Geneva, sans-serif 13px',
            columnHeaderFont: 'Tahoma, Geneva, sans-serif 12px',

            backgroundColor: backgroundColor,
            color: foregroundColor,
            rowStripeBackgroundColor: '#2b2b2b',

            columnHeaderBackgroundColor: columnHeaderBackgroundColor,
            columnHeaderForegroundColor: columnHeaderForegroundColor,
            selectionBackgroundColor: 'DarkSlateBlue',
            verticalGridLinesColor: '#595959',
            horizontalGridLinesColor: '#595959',
            grayedOutForegroundColor: '#595959',
            focusedRowBorderColor: '#C8B900',
            focusedCellBorderColor: 'magenta',
            scrollerThumbColor: '#858585',

            valueRecentlyModifiedBorderColor: '#8C5F46',
            valueRecentlyModifiedUpBorderColor: '#4646FF',
            valueRecentlyModifiedDownBorderColor: '#64FA64',
            recordRecentlyUpdatedBorderColor: 'orange',
            recordRecentlyInsertedBorderColor: 'pink',
        };
        this._gridSettings.merge(initialSettings);

        this._recordStore = new RecordStore();

        this._schemaServer = new RevRecordSchemaServer<GridField>();
        this._mainDataServer = new RevRecordDataServer<GridField>(this._schemaServer, this._recordStore);
        this._headerDataServer = new RevSingleHeadingDataServer();


        const definition: RevGridDefinition<RevSimpleBehavioredColumnSettings, GridField> = {
            schemaServer: this._schemaServer,
            subgrids: [
                {
                    role: RevSubgrid.Role.header,
                    dataServer: this._headerDataServer,
                    getCellPainterEventer: (viewCell) => this.getHeaderCellPainter(viewCell),
                },
                {
                    role: RevSubgrid.Role.main,
                    dataServer: this._mainDataServer,
                    getCellPainterEventer: (viewCell) => this.getMainCellPainter(viewCell),
                }
            ],
        };

        const options: RevGridOptions<AppBehavioredGridSettings, RevSimpleBehavioredColumnSettings, GridField> = {
            externalParent: this,
            canvasRenderingContext2DSettings: {
                alpha: false,
            }
        }

        this._grid = new RecordGrid(
            this._gridHostElement,
            definition,
            this._gridSettings,
            () => new RevSimpleInMemoryBehavioredColumnSettings(this._gridSettings),
            options,
        );

        const grid = this._grid;

        this._mainCellPainter = new MainCellPainter(grid, this._mainDataServer);
        this._headerCellPainter = new RevStandardHeaderTextCellPainter<AppBehavioredGridSettings, RevSimpleBehavioredColumnSettings, GridField>(grid, this._headerDataServer);

        grid.cellFocusChangedEventer = (newPoint, oldPoint) => this.handleCellFocusChanged(newPoint, oldPoint)
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

        grid.activate();

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

    start(): void {
        // no code needed
    }
    private getMainCellPainter(_viewCell: RevViewCell<RevSimpleBehavioredColumnSettings, GridField>) {
        return this._mainCellPainter;
    }

    private getHeaderCellPainter(_viewCell: RevViewCell<RevSimpleBehavioredColumnSettings, GridField>) {
        return this._headerCellPainter;
    }

    private handleCellFocusChanged(newPoint: RevPoint | undefined, oldPoint: RevPoint | undefined): void {
        const newText = newPoint === undefined ? '()' : `(${newPoint.x}, ${newPoint.y})`;
        const oldText = oldPoint === undefined ? '()' : `(${oldPoint.x}, ${oldPoint.y})`;
        console.log(`Focus for Record: New: ${newText} Old: ${oldText}`);
    }

    private handleCellFocusClick(cell: RevViewCell<RevSimpleBehavioredColumnSettings, GridField>): void {
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

    private handleRecordFocusDblClick(cell: RevViewCell<RevSimpleBehavioredColumnSettings, GridField>): void {
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

    private handleColumnSort(headerOrFixedRowCell: RevViewCell<RevSimpleBehavioredColumnSettings, GridField>) {
        this._mainDataServer.sortBy(headerOrFixedRowCell.viewLayoutColumn.column.field.index);
    }
}

const backgroundColor = '#212121';
const foregroundColor = '#f9f0f0';
const columnHeaderBackgroundColor = '#626262';
const columnHeaderForegroundColor = 'white';

