import { AdapterSetConfig, CellEditor, EventDetail, HalignEnum, Revgrid, TextCellPainter, ViewCell, defaultGridProperties } from '..';
import { HeaderDataAdapter } from './header-data-adapter';
import { MainDataAdapter } from './main-data-adapter';
import { SchemaAdapter } from './schema-adapter';

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

    private _mainDataAdapter: MainDataAdapter;
    private _cellPainter: TextCellPainter;
    private _grid: Revgrid;

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
                this._grid.settings.halign = this._rightHalignCheckboxElement.checked ? 'right' : 'left';
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
                this._mainDataAdapter.deleteRow(deleteRowIndex);
            };
        }

        this._addFishButtonElement = document.querySelector('#addFishButton') as HTMLButtonElement;
        if (this._addFishButtonElement === null) {
            throw new Error('addFishButtonElement not found');
        } else {
            this._addFishButtonElement.onclick = () => {
                this._mainDataAdapter.addFish();
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

        this._mainDataAdapter = new MainDataAdapter();
        this._cellPainter = new TextCellPainter();

        const adapterSet: AdapterSetConfig = {
            schemaModel: new SchemaAdapter(),
            subgrids: [
                {
                    role: 'header',
                    dataModel: new HeaderDataAdapter(),
                    getCellPainterEventer: (viewCell, prefillColor) => this.getCellPainter(viewCell, prefillColor),
                },
                {
                    role: 'main',
                    dataModel: this._mainDataAdapter,
                    getCellPainterEventer: (viewCell, prefillColor) => this.getCellPainter(viewCell, prefillColor),
                }
            ],
        };

        const gridOptions: Revgrid.Options = {
            container: this._gridHostElement,
            gridProperties: {
                editable: true,
                singleRowSelectionMode: false,
                autoSelectRows: false,
                restoreColumnSelections: false,
                sortOnDoubleClick: false,
                cellPadding: defaultCellPadding,
                halign: defaultHalign,
                fixedColumnCount: defaultFixedColumnCount,
                gridRightAligned: defaultGridRightAligned,
                scrollHorizontallySmoothly: defaultScrollHorizontallySmoothly,
                visibleColumnWidthAdjust: defaultVisibleColumnWidthAdjust,
            }
        };

        this._grid = new Revgrid(this._gridHostElement, adapterSet, gridOptions);

        this._fixedColumnCountTextboxElement.value = this._grid.settings.fixedColumnCount.toString();
        this._cellPaddingTextboxElement.value = this._grid.settings.cellPadding.toString();
        this._rightHalignCheckboxElement.checked = this._grid.settings.halign === HalignEnum.right;
        this._gridRightAlignedCheckboxElement.checked = this._grid.settings.gridRightAligned;
        this._scrollHorizontallySmoothlyCheckboxElement.checked = this._grid.settings.scrollHorizontallySmoothly;
        this._visibleColumnWidthAdjustCheckboxElement.checked = this._grid.settings.visibleColumnWidthAdjust;
        this._deleteRowIndexTextboxElement.value = '0';

        this._grid.addEventListener('rev-column-sort', (event) => {
                const cell = (event as CustomEvent<EventDetail.ColumnSort>).detail.revgridViewCell;
                if (cell !== undefined) {
                    this._mainDataAdapter.sort(cell.viewLayoutColumn.column);
                }
            }
        );

        this._grid.allowEvents(true);

        const columns = this._grid.getAllColumns();

        for (const column of columns) {
            switch (column.name) {
                case 'name':
                case 'type':
                case 'favoriteFood':
                    column.settings.editor = 'TextField';
                    break;
                case 'id':
                case 'age':
                    column.settings.editor = 'Number';
                    break;
                case 'receiveDate':
                    column.settings.editor = 'Date';
                    break;
                case 'color':
                    column.settings.editor = 'Color';
                    break;
                case 'restrictMovement':
                    column.settings.editor = 'TextField'; // need something else for boolean
                    break;
                default:
                    throw new Error(`Editor does not support field: ${column.name}`);
            }
        }
    }

    getCellPainter(viewCell: ViewCell, cellEditorPainter: CellEditor.Painter | undefined) {
        const painter = this._cellPainter;
        painter.setCell(viewCell, cellEditorPainter, this._grid);
        return painter;
    }
}

const defaultGridRightAligned = defaultGridProperties.gridRightAligned;
const defaultScrollHorizontallySmoothly = defaultGridProperties.scrollHorizontallySmoothly;
const defaultVisibleColumnWidthAdjust = defaultGridProperties.visibleColumnWidthAdjust;
const defaultCellPadding = defaultGridProperties.cellPadding;
const defaultFixedColumnCount: typeof defaultGridProperties.fixedColumnCount = 2;
const defaultHalign: typeof defaultGridProperties.halign = 'left';
