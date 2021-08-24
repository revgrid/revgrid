import { DataModel, SchemaModel } from "..";

export class DataSource implements DataModel {
    private readonly _data: Record[] = [];
    private _fishCount = 0;
    private _dataModelCallbackListener: DataModel.CallbackListener;

    constructor() {
        const initialDataCount = initialData.length;
        this._data.length = initialDataCount;
        for (let i = 0; i < initialDataCount; i++) {
            const record = initialData[i];
            record.receiveDate = this.calculateReceiveDate(record.age);
            this._data[i] = record;
        }
    }

    addDataCallbackListener(listener: DataModel.CallbackListener) {
        this._dataModelCallbackListener = listener;
    }

    getRowCount() {
        return this._data.length;
    }

    getSchema() {
        const columnSchema: ColumnSchema[] = [
            {
                name: 'name',
                index: 0,
                header: 'Name',
            },
            {
                name: 'type',
                index: 1,
                header: 'Type',
            },
            {
                name: 'color',
                index: 2,
                header : 'Color',
            },
            {
                name: 'age',
                index: 3,
                header: 'Age',
            },
            {
                name: 'receiveDate',
                index: 4,
                header: 'Receive Date',
            },
            {
                name: 'favoriteFood',
                index: 5,
                header: 'Favorite Food',
            },
            {
                name: 'restrictMovement',
                index: 6,
                header: 'Restrict Movement',
            },
        ];
        return columnSchema;
    }

    getValue(columnSchema: ColumnSchema, rowIndex: number) {
        const record = this._data[rowIndex];
        const fieldName = columnSchema.name;
        return record[fieldName];
    }

    addFish() {
        const addCount = 20;
        let addIdx = this._data.length;
        this._data.length += addCount;
        for (let i = 0; i < addCount; i++) {
            const record = this.createFishRecord();
            this._data[addIdx++] = record;
        }

        this._dataModelCallbackListener.dataShapeChanged();
    }

    private createFishRecord(): Record {
        const age = Math.round(0.2 + Math.random() * 100) / 100;
        const receiveDate = this.calculateReceiveDate(age);
        return {
            name: 'Bubbles' + (++this._fishCount).toString(),
            type: 'Fish',
            color: 'Grey',
            age,
            receiveDate,
            favoriteFood: 'Pellets',
            restrictMovement: true,
        }
    }

    private calculateReceiveDate(age: number) {
        const ageInMilliseconds = age * 1000 * 60 * 60 * 24 * 365;
        return new Date(Date.now() - ageInMilliseconds);
    }
}

export interface Record {
    name: string;
    type: string;
    color: string;
    age: number;
    receiveDate: Date;
    favoriteFood: string;
    restrictMovement: boolean;
}

interface ColumnSchema extends SchemaModel.Column {
    name: keyof Record;
    index: number;
    header: string;
}

const dummyDate = new Date();

const initialData: Record[] = [
    {
        name: 'Rover',
        type: 'Dog',
        color: 'red',
        age: 5,
        receiveDate: dummyDate,
        favoriteFood: 'meat',
        restrictMovement: true,
    },
    {
        name: 'Moggie',
        type: 'Cat',
        color: 'white and black',
        age: 7,
        receiveDate: dummyDate,
        favoriteFood: 'gravied meat',
        restrictMovement: false,
    },
    {
        name: 'Tweets',
        type: 'Canary',
        color: 'yellow',
        age: 0.5,
        receiveDate: dummyDate,
        favoriteFood: 'pellets',
        restrictMovement: true,
    },
];
