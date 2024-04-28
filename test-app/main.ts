import {
    HorizontalAlignEnum,
    InMemoryStandardBehavioredColumnSettings,
    InMemoryStandardBehavioredGridSettings,
    RevCellEditor,
    RevClientGrid,
    RevDatalessSubgrid,
    RevDatalessViewCell,
    RevDispatchableEvent,
    RevGridDefinition,
    RevSubgrid,
    RevViewCell,
    StandardAlphaTextCellPainter,
    StandardBehavioredColumnSettings,
    StandardBehavioredGridSettings,
    StandardCellPainter,
    StandardCheckboxCellPainter,
    StandardHeaderTextCellPainter,
    StandardTextInputCellEditor,
    StandardToggleClickBoxCellEditor,
    defaultGridSettings,
    defaultStandardColumnSettings,
    defaultStandardGridSettings
} from '..';
import { AppSchemaField } from './app-schema-field';
import { AppSchemaServer } from './app-schema-server';
import { HeaderDataServer } from './header-data-server';
import { MainDataServer } from './main-data-server';
import { MainRecord } from './main-record';

export class Main {
    private readonly _controlsElement: HTMLElement;
    private readonly _newGridButtonElement: HTMLButtonElement;
    private readonly _fixedColumnCountTextboxElement: HTMLInputElement;
    private readonly _cellPaddingTextboxElement: HTMLInputElement;
    private readonly _rightHalignCheckboxElement: HTMLInputElement;
    private readonly _gridRightAlignedCheckboxElement: HTMLInputElement;
    private readonly _scrollHorizontallySmoothlyCheckboxElement: HTMLInputElement;
    private readonly _visibleColumnWidthAdjustCheckboxElement: HTMLInputElement;
    private readonly _deleteRowButtonElement: HTMLButtonElement;
    private readonly _deleteRowIndexTextboxElement: HTMLInputElement;
    private readonly _addFishButtonElement: HTMLButtonElement;
    private readonly _gridHostElement: HTMLElement;
    private readonly _getSettingsForNewColumnListener = (field: AppSchemaField) => this.getSettingsForNewColumn(field);

    private _gridSettings: StandardBehavioredGridSettings = new InMemoryStandardBehavioredGridSettings();
    private _schemaServer: AppSchemaServer;
    private _headerDataServer: HeaderDataServer;
    private _mainDataServer: MainDataServer;
    private _headerCellPainter: StandardHeaderTextCellPainter<StandardBehavioredGridSettings, StandardBehavioredColumnSettings, AppSchemaField>;
    private _textCellPainter: StandardAlphaTextCellPainter<StandardBehavioredGridSettings, StandardBehavioredColumnSettings, AppSchemaField>;
    private _checkboxCellPainter: StandardCheckboxCellPainter<StandardBehavioredGridSettings, StandardBehavioredColumnSettings, AppSchemaField>;
    private _textInputEditor: StandardTextInputCellEditor<StandardBehavioredGridSettings, StandardBehavioredColumnSettings, AppSchemaField>;
    private _checkboxEditor: StandardToggleClickBoxCellEditor<StandardBehavioredGridSettings, StandardBehavioredColumnSettings, AppSchemaField>;

    private _grid: RevClientGrid<StandardBehavioredGridSettings, StandardBehavioredColumnSettings, AppSchemaField>;

    constructor() {
        const gridHostElement = document.querySelector('#gridHost');
        if (gridHostElement === null) {
            throw new Error('gridHostElement not found');
        }
        this._gridHostElement = gridHostElement as HTMLElement;

        const controlsElement = document.querySelector('#controls');
        if (controlsElement === null) {
            throw new Error('controlsElement not found');
        }
        this._controlsElement = controlsElement as HTMLElement;

        const newGridButtonElement = document.querySelector('#newGridButton');
        if (newGridButtonElement === null) {
            throw new Error('newGridButtonElement not found');
        } else {
            this._newGridButtonElement = newGridButtonElement as HTMLButtonElement;
            this._newGridButtonElement.onclick = () => {
                this.newGrid();
            };
        }

        const fixedColumnCountTextboxElement = document.querySelector('#fixedColumnCountTextbox');
        if (fixedColumnCountTextboxElement === null) {
            throw new Error('fixedColumnCountTextboxElement not found');
        } else {
            this._fixedColumnCountTextboxElement = fixedColumnCountTextboxElement as HTMLInputElement;
            this._fixedColumnCountTextboxElement.onchange = () => {
                this._grid.settings.fixedColumnCount = parseInt(this._fixedColumnCountTextboxElement.value);
            };
        }

        const cellPaddingTextboxElement = document.querySelector('#cellPaddingTextbox');
        if (cellPaddingTextboxElement === null) {
            throw new Error('cellPaddingTextboxElement not found');
        } else {
            this._cellPaddingTextboxElement = cellPaddingTextboxElement as HTMLInputElement;
            this._cellPaddingTextboxElement.onchange = () => {
                this._grid.settings.cellPadding = parseInt(this._cellPaddingTextboxElement.value);
            };
        }

        const rightHalignCheckboxElement = document.querySelector('#rightHalignCheckbox');
        if (rightHalignCheckboxElement === null) {
            throw new Error('rightHalignCheckBoxElement not found');
        } else {
            this._rightHalignCheckboxElement = rightHalignCheckboxElement as HTMLInputElement;
            this._rightHalignCheckboxElement.onchange = () => {
                this._grid.settings.horizontalAlign = this._rightHalignCheckboxElement.checked ? 'right' : 'left';
            };
        }

        const gridRightAlignedCheckboxElement = document.querySelector('#gridRightAlignedCheckbox');
        if (gridRightAlignedCheckboxElement === null) {
            throw new Error('gridRightAlignedCheckBoxElement not found');
        } else {
            this._gridRightAlignedCheckboxElement = gridRightAlignedCheckboxElement as HTMLInputElement;
            this._gridRightAlignedCheckboxElement.onchange = () => {
                this._grid.settings.gridRightAligned = this._gridRightAlignedCheckboxElement.checked;
            };
        }

        const scrollHorizontallySmoothlyCheckboxElement = document.querySelector('#scrollHorizontallySmoothlyCheckbox');
        if (scrollHorizontallySmoothlyCheckboxElement === null) {
            throw new Error('scrollHorizontallySmoothlyCheckBoxElement not found');
        } else {
            this._scrollHorizontallySmoothlyCheckboxElement = scrollHorizontallySmoothlyCheckboxElement as HTMLInputElement;
            this._scrollHorizontallySmoothlyCheckboxElement.onchange = () => {
                this._grid.settings.scrollHorizontallySmoothly = this._scrollHorizontallySmoothlyCheckboxElement.checked;
            };
        }

        const visibleColumnWidthAdjustCheckboxElement = document.querySelector('#visibleColumnWidthAdjustCheckbox');
        if (visibleColumnWidthAdjustCheckboxElement === null) {
            throw new Error('visibleColumnWidthAdjustCheckBoxElement not found');
        } else {
            this._visibleColumnWidthAdjustCheckboxElement = visibleColumnWidthAdjustCheckboxElement as HTMLInputElement;
            this._visibleColumnWidthAdjustCheckboxElement.onchange = () => {
                this._grid.settings.visibleColumnWidthAdjust = this._visibleColumnWidthAdjustCheckboxElement.checked;
            };
        }

        const deleteRowIndexTextboxElement = document.querySelector('#deleteRowIndexTextbox');
        if (deleteRowIndexTextboxElement === null) {
            throw new Error('deleteRowIndexTextboxElement not found');
        } else {
            this._deleteRowIndexTextboxElement = deleteRowIndexTextboxElement as HTMLInputElement;
        }

        const deleteRowButtonElement = document.querySelector('#deleteRowButton');
        if (deleteRowButtonElement === null) {
            throw new Error('deleteRowButtonElement not found');
        } else {
            this._deleteRowButtonElement = deleteRowButtonElement as HTMLButtonElement;
            this._deleteRowButtonElement.onclick = () => {
                const deleteRowIndex = parseInt(this._deleteRowIndexTextboxElement.value);
                this._mainDataServer.deleteRow(deleteRowIndex);
            };
        }

        const addFishButtonElement = document.querySelector('#addFishButton');
        if (addFishButtonElement === null) {
            throw new Error('addFishButtonElement not found');
        } else {
            this._addFishButtonElement = addFishButtonElement as HTMLButtonElement;
            this._addFishButtonElement.onclick = () => {
                this._mainDataServer.addFish();
            };
        }
    }

    start(): void {
        this.newGrid();
    }

    private newGrid() {
        if (this._grid !== undefined) {
            this._grid.destroy();
        }

        const gridSettings = this._gridSettings;

        gridSettings.beginChange();
        gridSettings.merge(defaultStandardGridSettings);

        gridSettings.editable = true;
        gridSettings.cellPadding = defaultCellPadding;
        gridSettings.horizontalAlign = defaultHorizontalAlign;
        gridSettings.fixedColumnCount = defaultFixedColumnCount;
        gridSettings.gridRightAligned = defaultGridRightAligned;
        gridSettings.scrollHorizontallySmoothly = defaultScrollHorizontallySmoothly;
        gridSettings.visibleColumnWidthAdjust = defaultVisibleColumnWidthAdjust;
        gridSettings.rowStripeBackgroundColor = 'gainsboro';
        gridSettings.horizontalGridLinesVisible = false;

        gridSettings.cellFocusedBorderColor = '#696969';
        gridSettings.cellHoverBackgroundColor = 'rgba(160, 160, 40, 0.45)';
        gridSettings.columnHoverBackgroundColor = 'rgba(100, 100, 25, 0.30)';
        gridSettings.columnHeaderFont = '12px Tahoma, Geneva, sans-serif';
        gridSettings.columnHeaderHorizontalAlign = 'center';
        gridSettings.columnHeaderBackgroundColor = 'rgb(223, 227, 250)';
        gridSettings.columnHeaderForegroundColor = 'rgb(25, 25, 25)';
        gridSettings.columnHeaderSelectionFont = 'bold 12px Tahoma, Geneva, sans-serif';
        gridSettings.columnHeaderSelectionForegroundColor = 'rgb(80, 80, 80)';
        gridSettings.columnHeaderSelectionBackgroundColor = 'rgba(255, 220, 97, 0.45)';
        gridSettings.rowHoverBackgroundColor = 'rgba(60, 60, 15, 0.40)';
        gridSettings.selectionFont = 'bold 13px Tahoma, Geneva, sans-serif';
        gridSettings.selectionBackgroundColor = 'rgba(147, 185, 255, 0.625)';
        gridSettings.selectionForegroundColor = 'rgb(0, 0, 128)';

        gridSettings.eventDispatchEnabled = true;
        gridSettings.endChange();


        this._schemaServer = new AppSchemaServer();
        this._mainDataServer = new MainDataServer();
        this._headerDataServer = new HeaderDataServer();

        const definition: RevGridDefinition<StandardBehavioredColumnSettings, AppSchemaField> = {
            schemaServer: this._schemaServer,
            subgrids: [
                {
                    role: RevDatalessSubgrid.RoleEnum.header,
                    dataServer: this._headerDataServer,
                    getCellPainterEventer: (viewCell) => this.getHeaderCellPainter(viewCell),
                },
                {
                    role: RevDatalessSubgrid.RoleEnum.main,
                    dataServer: this._mainDataServer,
                    getCellPainterEventer: (viewCell) => this.getMainCellPainter(viewCell),
                }
            ],
        };

        this._grid = new RevClientGrid(this._gridHostElement, definition, this._gridSettings, this._getSettingsForNewColumnListener, { externalParent: this });

        this._headerCellPainter = new StandardHeaderTextCellPainter(this._grid, this._headerDataServer);
        this._textCellPainter = new StandardAlphaTextCellPainter(this._grid, this._mainDataServer);
        this._checkboxCellPainter = new StandardCheckboxCellPainter(this._grid, this._mainDataServer, false);
        this._textInputEditor = new StandardTextInputCellEditor(this._grid, this._mainDataServer);
        const checkboxCellPainter = new StandardCheckboxCellPainter(this._grid, this._mainDataServer, true);
        this._checkboxEditor = new StandardToggleClickBoxCellEditor(this._grid, this._mainDataServer, checkboxCellPainter);


        this._fixedColumnCountTextboxElement.value = this._grid.settings.fixedColumnCount.toString();
        this._cellPaddingTextboxElement.value = this._grid.settings.cellPadding.toString();
        this._rightHalignCheckboxElement.checked = this._grid.settings.horizontalAlign === HorizontalAlignEnum.right;
        this._gridRightAlignedCheckboxElement.checked = this._grid.settings.gridRightAligned;
        this._scrollHorizontallySmoothlyCheckboxElement.checked = this._grid.settings.scrollHorizontallySmoothly;
        this._visibleColumnWidthAdjustCheckboxElement.checked = this._grid.settings.visibleColumnWidthAdjust;
        this._deleteRowIndexTextboxElement.value = '0';

        this._grid.addEventListener('rev-column-sort', (event) => {
                const hoverCell = (event as CustomEvent<RevDispatchableEvent.Detail.ColumnSort<StandardBehavioredColumnSettings, AppSchemaField>>).detail.revgridHoverCell;
                if (hoverCell !== undefined) {
                    this._mainDataServer.sort(hoverCell.viewCell.viewLayoutColumn.column);
                }
            }
        );

        this._grid.focus.getCellEditorEventer = (
            field,
            subgridRowIndex,
            subgrid,
            readonly,
            viewCell
        ) => this.getCellEditor(field, subgridRowIndex, subgrid, readonly, viewCell);

        this._grid.activate();

        // const columns = this._grid.getAllColumns();

        // for (const column of columns) {
        //     switch (column.name) {
        //         case 'name':
        //         case 'type':
        //         case 'favoriteFood':
        //             column.settings.editor = 'TextField';
        //             break;
        //         case 'id':
        //         case 'age':
        //             column.settings.editor = 'Number';
        //             break;
        //         case 'receiveDate':
        //             column.settings.editor = 'Date';
        //             break;
        //         case 'color':
        //             column.settings.editor = 'Color';
        //             break;
        //         case 'restrictMovement':
        //             column.settings.editor = 'TextField'; // need something else for boolean
        //             break;
        //         default:
        //             throw new Error(`Editor does not support field: ${column.name}`);
        //     }
        // }
    }

    private getSettingsForNewColumn(_field: AppSchemaField) {
        const columnSettings = new InMemoryStandardBehavioredColumnSettings(this._gridSettings) as StandardBehavioredColumnSettings;
        columnSettings.merge(defaultStandardColumnSettings);
        return columnSettings;
    }

    private getMainCellPainter(viewCell: RevDatalessViewCell<StandardBehavioredColumnSettings, AppSchemaField>) {
        let cellPainter: StandardCellPainter<
            StandardBehavioredGridSettings,
            StandardBehavioredColumnSettings,
            AppSchemaField
        >;

        if (viewCell.viewLayoutColumn.column.field === this._schemaServer.restrictMovementSchemaField) {
            cellPainter = this._checkboxCellPainter;
        } else {
            cellPainter = this._textCellPainter;
        }
        return cellPainter;
    }

    private getHeaderCellPainter(viewCell: RevDatalessViewCell<StandardBehavioredColumnSettings, AppSchemaField>) {
        return this._headerCellPainter;
    }

    private getCellEditor(
        field: AppSchemaField,
        _subgridRowIndex: number,
        _subgrid: RevSubgrid<StandardBehavioredColumnSettings, AppSchemaField>,
        readonly: boolean,
        _viewCell: RevViewCell<StandardBehavioredColumnSettings, AppSchemaField> | undefined
    ): RevCellEditor<StandardBehavioredColumnSettings, AppSchemaField> | undefined {
        return this.tryGetCellEditor(field.name, readonly);
    }

    private tryGetCellEditor(columnName: keyof MainRecord, readonly: boolean) {
        const editor = this.tryCreateCellEditor(columnName);
        if (editor !== undefined) {
            editor.readonly = readonly;
        }
        return editor;
    }

    private tryCreateCellEditor(columnName: keyof MainRecord) {
        switch (columnName) {
            case 'favoriteFood': return this._textInputEditor;
            case 'restrictMovement': return this._checkboxEditor;
            default: return undefined;
        }
    }
}

const defaultGridRightAligned = defaultGridSettings.gridRightAligned;
const defaultScrollHorizontallySmoothly = defaultGridSettings.scrollHorizontallySmoothly;
const defaultVisibleColumnWidthAdjust = defaultGridSettings.visibleColumnWidthAdjust;
const defaultCellPadding = defaultStandardGridSettings.cellPadding;
const defaultFixedColumnCount: typeof defaultGridSettings.fixedColumnCount = 2;
const defaultHorizontalAlign: typeof defaultStandardGridSettings.horizontalAlign = 'left';
