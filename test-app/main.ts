import { defaultGridProperties, Hypegrid } from "..";
import { DataSource } from './data-source';

export class Main {
    private readonly _controlsElement: HTMLElement;
    private readonly _fixedColumnCountTextboxElement: HTMLInputElement;
    private readonly _cellPaddingTextboxElement: HTMLInputElement;
    private readonly _rightHalignCheckboxElement: HTMLInputElement;
    private readonly _gridRightAlignedCheckboxElement: HTMLInputElement;
    private readonly _scrollHorizontallySmoothlyCheckboxElement: HTMLInputElement;
    private readonly _visibleColumnWidthAdjustCheckboxElement: HTMLInputElement;
    private readonly _addFishButtonElement: HTMLButtonElement;
    private readonly _gridHostElement: HTMLElement;
    private readonly _grid: Hypegrid;
    private readonly _dataSource: DataSource;

    constructor() {
        const gridHostElement = document.querySelector('#gridHost') as HTMLElement;
        if (gridHostElement === null) {
            throw new Error('gridHostElement not found');
        }
        this._gridHostElement = gridHostElement;

        this._dataSource = new DataSource;

        const defaultGridRightAligned = defaultGridProperties.gridRightAligned;
        const defaultScrollHorizontallySmoothly = defaultGridProperties.scrollHorizontallySmoothly;
        const defaultVisibleColumnWidthAdjust = defaultGridProperties.visibleColumnWidthAdjust;
        const defaultCellPadding = defaultGridProperties.cellPadding;
        const defaultFixedColumnCount: typeof defaultGridProperties.fixedColumnCount = 2;
        const defaultHalign: typeof defaultGridProperties.halign = 'left';
        const defaultRightHalign = false; // make sure it corresponds to defaultHalign

        const gridOptions: Hypegrid.Options = {
            container: this._gridHostElement,
            model: {
                schema: this._dataSource,
                subgrids: [
                    'header', // use builtin header data model
                    {
                        dataModel: this._dataSource,
                        role: 'main',
                    }
                ],
            },
            gridProperties: {
                renderFalsy: true,
                singleRowSelectionMode: false,
                columnSelection: false,
                cellPadding: defaultCellPadding,
                halign: defaultHalign,
                fixedColumnCount: defaultFixedColumnCount,
                gridRightAligned: defaultGridRightAligned,
                scrollHorizontallySmoothly: defaultScrollHorizontallySmoothly,
                visibleColumnWidthAdjust: defaultVisibleColumnWidthAdjust,
            }
        }
        this._grid = new Hypegrid(this._gridHostElement, gridOptions);

        const controlsElement = document.querySelector('#controls') as HTMLElement;
        if (controlsElement === null) {
            throw new Error('controlsElement not found');
        }
        this._controlsElement = controlsElement;

        this._fixedColumnCountTextboxElement = document.querySelector('#fixedColumnCountTextbox') as HTMLInputElement;
        if (this._fixedColumnCountTextboxElement === null) {
            throw new Error('fixedColumnCountTextboxElement not found');
        } else {
            this._fixedColumnCountTextboxElement.value = defaultFixedColumnCount.toString();
            this._fixedColumnCountTextboxElement.onchange = () => {
                this._grid.properties.fixedColumnCount = parseInt(this._fixedColumnCountTextboxElement.value);
                this._grid.computeCellsBounds();
                this._grid.repaint();
            };
        }

        this._cellPaddingTextboxElement = document.querySelector('#cellPaddingTextbox') as HTMLInputElement;
        if (this._cellPaddingTextboxElement === null) {
            throw new Error('cellPaddingTextboxElement not found');
        } else {
            this._cellPaddingTextboxElement.value = defaultCellPadding.toString();
            this._cellPaddingTextboxElement.onchange = () => {
                this._grid.properties.cellPadding = parseInt(this._cellPaddingTextboxElement.value);
                this._grid.computeCellsBounds();
                this._grid.repaint();
            };
        }

        this._rightHalignCheckboxElement = document.querySelector('#rightHalignCheckbox') as HTMLInputElement;
        if (this._rightHalignCheckboxElement === null) {
            throw new Error('rightHalignCheckBoxElement not found');
        } else {
            this._rightHalignCheckboxElement.checked = defaultRightHalign;
            this._rightHalignCheckboxElement.onchange = () => {
                this._grid.properties.halign = this._rightHalignCheckboxElement.checked ? 'right' : 'left';
                this._grid.computeCellsBounds();
                this._grid.repaint();
            };
        }

        this._gridRightAlignedCheckboxElement = document.querySelector('#gridRightAlignedCheckbox') as HTMLInputElement;
        if (this._gridRightAlignedCheckboxElement === null) {
            throw new Error('gridRightAlignedCheckBoxElement not found');
        } else {
            this._gridRightAlignedCheckboxElement.checked = defaultGridRightAligned;
            this._gridRightAlignedCheckboxElement.onchange = () => {
                this._grid.properties.gridRightAligned = this._gridRightAlignedCheckboxElement.checked;
                this._grid.computeCellsBounds();
                this._grid.repaint();
            };
        }

        this._scrollHorizontallySmoothlyCheckboxElement = document.querySelector('#scrollHorizontallySmoothlyCheckbox') as HTMLInputElement;
        if (this._scrollHorizontallySmoothlyCheckboxElement === null) {
            throw new Error('scrollHorizontallySmoothlyCheckBoxElement not found');
        } else {
            this._scrollHorizontallySmoothlyCheckboxElement.checked = defaultScrollHorizontallySmoothly;
            this._scrollHorizontallySmoothlyCheckboxElement.onchange = () => {
                this._grid.properties.scrollHorizontallySmoothly = this._scrollHorizontallySmoothlyCheckboxElement.checked;
                this._grid.computeCellsBounds();
                this._grid.repaint();
            };
        }

        this._visibleColumnWidthAdjustCheckboxElement = document.querySelector('#visibleColumnWidthAdjustCheckbox') as HTMLInputElement;
        if (this._visibleColumnWidthAdjustCheckboxElement === null) {
            throw new Error('visibleColumnWidthAdjustCheckBoxElement not found');
        } else {
            this._visibleColumnWidthAdjustCheckboxElement.checked = this._grid.properties.visibleColumnWidthAdjust;
            this._visibleColumnWidthAdjustCheckboxElement.onchange = () => {
                this._grid.properties.visibleColumnWidthAdjust = this._visibleColumnWidthAdjustCheckboxElement.checked;
                this._grid.computeCellsBounds();
                this._grid.repaint();
            };
        }

        this._addFishButtonElement = document.querySelector('#addFishButton') as HTMLButtonElement;
        if (this._addFishButtonElement === null) {
            throw new Error('addFishButtonElement not found');
        } else {
            this._addFishButtonElement.onclick = () => {
                this._dataSource.addFish();
            };
        }
    }

    start(): void {
        this._grid.allowEvents(true);
    }

    // private numberToPixels(value: number): string {
    //     return value.toString(10) + 'px';
    // }
}
