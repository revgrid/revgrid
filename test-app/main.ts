import { Hypergrid, HypergridProperties } from "..";
import { DataSource } from './data-source';

export class Main {
    private _controlsElement: HTMLElement;
    private _gridHostElement: HTMLElement;
    private _grid: Hypergrid;
    private _dataSource: DataSource;

    constructor() {
        const controlsElement = document.querySelector('#controls') as HTMLElement;
        if (controlsElement === null) {
            throw new Error('controlsElement not found');
        }
        this._controlsElement = controlsElement;
        const gridHostElement = document.querySelector('#gridHost') as HTMLElement;
        if (gridHostElement === null) {
            throw new Error('gridHostElement not found');
        }
        this._gridHostElement = gridHostElement;

        this._dataSource = new DataSource;
        const gridOptions: Hypergrid.Options = {
            container: this._gridHostElement,
            dataModel: this._dataSource,
        }
        this._grid = new Hypergrid(this._gridHostElement, gridOptions);
        const properties: HypergridProperties = {
            rowHeaderNumbers: false,
            rowHeaderCheckboxes: false,
            renderFalsy: true,
            singleRowSelectionMode: false,
            columnSelection: false,
            subgrids: [
                'header',
                'main',
            ],
        }
        this._grid.addProperties(properties);

    }

    start(): void {
        this._grid.allowEvents(true);
    }

    // private numberToPixels(value: number): string {
    //     return value.toString(10) + 'px';
    // }
}
