import {
    CellEditor,
    DatalessSubgrid,
    DatalessViewCell,
    EventDetail,
    HalignEnum,
    Revgrid,
    StandardAlphaTextCellPainter,
    StandardCellPainter,
    StandardCheckboxCellEditor,
    StandardCheckboxCellPainter,
    StandardHeaderTextCellPainter,
    StandardInMemoryBehavioredColumnSettings,
    StandardInMemoryBehavioredGridSettings,
    StandardTextInputCellEditor,
    Subgrid,
    ViewCell,
    gridSettingsDefaults,
    standardAllGridSettingsDefaults,
    standardGridSettingsDefaults
} from '..';
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

    private _gridSettings = new StandardInMemoryBehavioredGridSettings();
    private _schemaServer: AppSchemaServer;
    private _headerDataServer: HeaderDataServer;
    private _mainDataServer: MainDataServer;
    private _headerCellPainter: StandardHeaderTextCellPainter<StandardInMemoryBehavioredGridSettings, StandardInMemoryBehavioredColumnSettings, AppSchemaServer.Field>;
    private _textCellPainter: StandardAlphaTextCellPainter<StandardInMemoryBehavioredGridSettings, StandardInMemoryBehavioredColumnSettings, AppSchemaServer.Field>;
    private _checkboxCellPainter: StandardCheckboxCellPainter<StandardInMemoryBehavioredGridSettings, StandardInMemoryBehavioredColumnSettings, AppSchemaServer.Field>;
    private _textInputEditor: StandardTextInputCellEditor<StandardInMemoryBehavioredGridSettings, StandardInMemoryBehavioredColumnSettings, AppSchemaServer.Field>;
    private _checkboxEditor: StandardCheckboxCellEditor<StandardInMemoryBehavioredGridSettings, StandardInMemoryBehavioredColumnSettings, AppSchemaServer.Field>;

    private _grid: Revgrid<StandardInMemoryBehavioredGridSettings, StandardInMemoryBehavioredColumnSettings, AppSchemaServer.Field>;

    constructor() {
        const gridHostElement = document.querySelector('#gridHost') as HTMLElement;
        if (gridHostElement === null) {
            throw new Error('gridHostElement not found');
        }
        this._gridHostElement = gridHostElement;

        const controlsElement = document.querySelector('#controls') as HTMLElement;
        if (controlsElement === null) {
            throw new Error('controlsElement not found');
        }
        this._controlsElement = controlsElement;

        this._newGridButtonElement = document.querySelector('#newGridButton') as HTMLButtonElement;
        if (this._newGridButtonElement === null) {
            throw new Error('newGridButtonElement not found');
        } else {
            this._newGridButtonElement.onclick = () => {
                this.newGrid();
            };
        }

        this._fixedColumnCountTextboxElement = document.querySelector('#fixedColumnCountTextbox') as HTMLInputElement;
        if (this._fixedColumnCountTextboxElement === null) {
            throw new Error('fixedColumnCountTextboxElement not found');
        } else {
            this._fixedColumnCountTextboxElement.onchange = () => {
                this._grid.settings.fixedColumnCount = parseInt(this._fixedColumnCountTextboxElement.value);
            };
        }

        this._cellPaddingTextboxElement = document.querySelector('#cellPaddingTextbox') as HTMLInputElement;
        if (this._cellPaddingTextboxElement === null) {
            throw new Error('cellPaddingTextboxElement not found');
        } else {
            this._cellPaddingTextboxElement.onchange = () => {
                this._grid.settings.cellPadding = parseInt(this._cellPaddingTextboxElement.value);
            };
        }

        this._rightHalignCheckboxElement = document.querySelector('#rightHalignCheckbox') as HTMLInputElement;
        if (this._rightHalignCheckboxElement === null) {
            throw new Error('rightHalignCheckBoxElement not found');
        } else {
            this._rightHalignCheckboxElement.onchange = () => {
                this._grid.settings.horizontalAlign = this._rightHalignCheckboxElement.checked ? 'right' : 'left';
            };
        }

        this._gridRightAlignedCheckboxElement = document.querySelector('#gridRightAlignedCheckbox') as HTMLInputElement;
        if (this._gridRightAlignedCheckboxElement === null) {
            throw new Error('gridRightAlignedCheckBoxElement not found');
        } else {
            this._gridRightAlignedCheckboxElement.onchange = () => {
                this._grid.settings.gridRightAligned = this._gridRightAlignedCheckboxElement.checked;
            };
        }

        this._scrollHorizontallySmoothlyCheckboxElement = document.querySelector('#scrollHorizontallySmoothlyCheckbox') as HTMLInputElement;
        if (this._scrollHorizontallySmoothlyCheckboxElement === null) {
            throw new Error('scrollHorizontallySmoothlyCheckBoxElement not found');
        } else {
            this._scrollHorizontallySmoothlyCheckboxElement.onchange = () => {
                this._grid.settings.scrollHorizontallySmoothly = this._scrollHorizontallySmoothlyCheckboxElement.checked;
            };
        }

        this._visibleColumnWidthAdjustCheckboxElement = document.querySelector('#visibleColumnWidthAdjustCheckbox') as HTMLInputElement;
        if (this._visibleColumnWidthAdjustCheckboxElement === null) {
            throw new Error('visibleColumnWidthAdjustCheckBoxElement not found');
        } else {
            this._visibleColumnWidthAdjustCheckboxElement.onchange = () => {
                this._grid.settings.visibleColumnWidthAdjust = this._visibleColumnWidthAdjustCheckboxElement.checked;
            };
        }

        this._deleteRowIndexTextboxElement = document.querySelector('#deleteRowIndexTextbox') as HTMLInputElement;
        if (this._deleteRowIndexTextboxElement === null) {
            throw new Error('deleteRowIndexTextboxElement not found');
        }

        this._deleteRowButtonElement = document.querySelector('#deleteRowButton') as HTMLButtonElement;
        if (this._deleteRowButtonElement === null) {
            throw new Error('deleteRowButtonElement not found');
        } else {
            this._deleteRowButtonElement.onclick = () => {
                const deleteRowIndex = parseInt(this._deleteRowIndexTextboxElement.value);
                this._mainDataServer.deleteRow(deleteRowIndex);
            };
        }

        this._addFishButtonElement = document.querySelector('#addFishButton') as HTMLButtonElement;
        if (this._addFishButtonElement === null) {
            throw new Error('addFishButtonElement not found');
        } else {
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
        gridSettings.load(standardAllGridSettingsDefaults);

        gridSettings.editable = true;
        gridSettings.multipleSelectionAreas = true;
        gridSettings.cellPadding = defaultCellPadding;
        gridSettings.horizontalAlign = defaultHorizontalAlign;
        gridSettings.fixedColumnCount = defaultFixedColumnCount;
        gridSettings.gridRightAligned = defaultGridRightAligned;
        gridSettings.scrollHorizontallySmoothly = defaultScrollHorizontallySmoothly;
        gridSettings.visibleColumnWidthAdjust = defaultVisibleColumnWidthAdjust;
        gridSettings.eventDispatchEnabled = true;
        gridSettings.endChange();


        this._schemaServer = new AppSchemaServer(gridSettings);
        this._mainDataServer = new MainDataServer();
        this._headerDataServer = new HeaderDataServer();

        const definition: Revgrid.Definition<StandardInMemoryBehavioredColumnSettings, AppSchemaServer.Field> = {
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

        this._grid = new Revgrid(this._gridHostElement, definition, this._gridSettings);

        this._headerCellPainter = new StandardHeaderTextCellPainter(this._grid, this._headerDataServer);
        this._textCellPainter = new StandardAlphaTextCellPainter(this._grid, this._mainDataServer);
        this._checkboxCellPainter = new StandardCheckboxCellPainter(this._grid, this._mainDataServer, false);
        this._textInputEditor = new StandardTextInputCellEditor(this._grid, this._mainDataServer);
        this._checkboxEditor = new StandardCheckboxCellEditor(this._grid, this._mainDataServer);


        this._fixedColumnCountTextboxElement.value = this._grid.settings.fixedColumnCount.toString();
        this._cellPaddingTextboxElement.value = this._grid.settings.cellPadding.toString();
        this._rightHalignCheckboxElement.checked = this._grid.settings.horizontalAlign === HalignEnum.right;
        this._gridRightAlignedCheckboxElement.checked = this._grid.settings.gridRightAligned;
        this._scrollHorizontallySmoothlyCheckboxElement.checked = this._grid.settings.scrollHorizontallySmoothly;
        this._visibleColumnWidthAdjustCheckboxElement.checked = this._grid.settings.visibleColumnWidthAdjust;
        this._deleteRowIndexTextboxElement.value = '0';

        this._grid.addEventListener('rev-column-sort', (event) => {
                const hoverCell = (event as CustomEvent<EventDetail.ColumnSort<StandardInMemoryBehavioredColumnSettings, AppSchemaServer.Field>>).detail.revgridHoverCell;
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

        this._grid.allowEvents(true);

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

    private getMainCellPainter(viewCell: DatalessViewCell<StandardInMemoryBehavioredColumnSettings, AppSchemaServer.Field>) {
        let cellPainter: StandardCellPainter<
            StandardInMemoryBehavioredGridSettings,
            StandardInMemoryBehavioredColumnSettings,
            AppSchemaServer.Field
        >;

        if (viewCell.viewLayoutColumn.column.field === this._schemaServer.restrictMovementSchemaField) {
            cellPainter = this._checkboxCellPainter;
        } else {
            cellPainter = this._textCellPainter;
        }
        return cellPainter;
    }

    private getHeaderCellPainter(viewCell: DatalessViewCell<StandardInMemoryBehavioredColumnSettings, AppSchemaServer.Field>) {
        return this._headerCellPainter;
    }

    private getCellEditor(
        field: AppSchemaServer.Field,
        _subgridRowIndex: number,
        _subgrid: Subgrid<StandardInMemoryBehavioredColumnSettings, AppSchemaServer.Field>,
        readonly: boolean,
        _viewCell: ViewCell<StandardInMemoryBehavioredColumnSettings, AppSchemaServer.Field> | undefined
    ): CellEditor<StandardInMemoryBehavioredColumnSettings, AppSchemaServer.Field> | undefined {
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

const defaultGridRightAligned = gridSettingsDefaults.gridRightAligned;
const defaultScrollHorizontallySmoothly = gridSettingsDefaults.scrollHorizontallySmoothly;
const defaultVisibleColumnWidthAdjust = gridSettingsDefaults.visibleColumnWidthAdjust;
const defaultCellPadding = standardGridSettingsDefaults.cellPadding;
const defaultFixedColumnCount: typeof gridSettingsDefaults.fixedColumnCount = 2;
const defaultHorizontalAlign: typeof standardGridSettingsDefaults.horizontalAlign = 'left';
