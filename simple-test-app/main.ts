import { GridProperties, RevSimpleAdapterSet } from "..";
import { SimpleGrid } from './simple-grid';

export class Main {
    private readonly _grid: SimpleGrid;
    constructor() {

        const gridHostElement = document.querySelector('#gridHost') as HTMLElement;
        if (gridHostElement === null) {
            throw new Error('gridHost not found');
        }

        const loadStocksButtonElement = document.querySelector('#loadStocksButton') as HTMLButtonElement;
        if (loadStocksButtonElement === null) {
            throw new Error('loadStocksButton not found');
        }
        loadStocksButtonElement.onclick = () => this.loadStocks();

        const loadPetsButtonElement = document.querySelector('#loadPetsButton') as HTMLButtonElement;
        if (loadPetsButtonElement === null) {
            throw new Error('loadPetsButton not found');
        }
        loadPetsButtonElement.onclick = () => this.loadPets();

        const loadManyButtonElement = document.querySelector('#loadManyButton') as HTMLButtonElement;
        if (loadManyButtonElement === null) {
            throw new Error('loadManyButton not found');
        }
        loadManyButtonElement.onclick = () => this.loadMany();

        this._grid = this.createGrid(gridHostElement);

        this.loadStocks();
    }

    private createGrid(hostElement: HTMLElement) {
        const gridProperties: Partial<GridProperties> = {
            renderFalsy: true,
            autoSelectRows: false,
            singleRowSelectionMode: false,
            columnSelection: false,
            rowSelection: false,
            restoreColumnSelections: false,
            multipleSelections: false,
            sortOnDoubleClick: false,
        };

        const grid = new SimpleGrid(hostElement, gridProperties);

        grid.rowFocusEventer = (newRecordIndex, oldRecordIndex) => this.handleRowFocus(newRecordIndex, oldRecordIndex)
        grid.rowFocusClickEventer = (columnIndex, recordIndex) => this.handleRowFocusClick(columnIndex, recordIndex);
        grid.rowFocusDblClickEventer = (columnIndex, recordIndex) => this.handleRecordFocusDblClick(columnIndex, recordIndex);

        return grid;
    }

    private handleRowFocus(newRowIndex: number | undefined, oldRowIndex: number | undefined): void {
        console.log(`Focus for Record: New: ${newRowIndex} Old: ${oldRowIndex}`);
    }

    private handleRowFocusClick(columnIndex: number, rowIndex: number): void {
        console.log(`Click for Record ${rowIndex} column ${columnIndex}`);
    }

    private handleRecordFocusDblClick(columnIndex: number, rowIndex: number): void {
        console.log(`DoubleClick for Record ${rowIndex} field ${columnIndex}`);
    }

    private loadStocks() {
        this._grid.setData([
            { symbol: 'APPL', name: 'Apple Inc.', prevclose: 93.13 },
            { symbol: 'MSFT', name: 'Microsoft Corporation', prevclose: 51.91 },
            { symbol: 'TSLA', name: 'Tesla Motors Inc.', prevclose: 196.40 },
            { symbol: 'IBM', name: 'International Business Machines Corp', prevclose: 155.35 }
        ]);
    }

    private loadPets() {
        interface Pet extends RevSimpleAdapterSet.DataRow {
            name: string;
            type: string;
            color: string;
            age: number | string;
            receiveDate: Date | string;
            favoriteFood: string;
            restrictMovement: boolean | string;
        }

        const roverAge = 5;
        const moggieAge = 7;
        const tweetsAge = 0.5;

        const pets: Pet[] = [
            {
                name: 'Name',
                type: 'Type',
                color: 'Color',
                age: 'Age',
                receiveDate: 'Receive Date',
                favoriteFood: 'Favorite Food',
                restrictMovement: 'Restrict Movement',
            },
            {
                name: 'Rover',
                type: 'Dog',
                color: 'red',
                age: roverAge,
                receiveDate: this.calculatePetReceiveDate(roverAge),
                favoriteFood: 'meat',
                restrictMovement: true,
            },
            {
                name: 'Moggie',
                type: 'Cat',
                color: 'white and black',
                age: moggieAge,
                receiveDate: this.calculatePetReceiveDate(moggieAge),
                favoriteFood: 'gravied meat',
                restrictMovement: false,
            },
            {
                name: 'Tweets',
                type: 'Canary',
                color: 'yellow',
                age: tweetsAge,
                receiveDate: this.calculatePetReceiveDate(tweetsAge),
                favoriteFood: 'pellets',
                restrictMovement: true,
            },
        ];

        this._grid.setData(pets, 1);
    }

    private calculatePetReceiveDate(age: number) {
        const ageInMilliseconds = age * 1000 * 60 * 60 * 24 * 365;
        return new Date(Date.now() - ageInMilliseconds);
    }

    private loadMany() {
        interface Row extends RevSimpleAdapterSet.DataRow {
            StrCol: string;
            NumberCol: number;
            BoolCol: boolean;
            BigIntCol: BigInt;
            DateCol: Date;
        }

        const rowCount = 200;
        const rows = new Array<Row>(rowCount);

        for (let i = 1; i <= rowCount; i++) {
            const row: Row = {
                StrCol: `string${i}`,
                NumberCol: i,
                BoolCol: (i % 2) === 0,
                BigIntCol: BigInt(i),
                DateCol: new Date(2000, 1, (i % 31) + 1)
            }

            rows[i-1] = row;
        }

        this._grid.setData(rows, 0);
    }
}
