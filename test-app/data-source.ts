import { DataModel } from "..";

export class DataSource implements DataModel {
    getRowCount() {
        return data.length;
    }

    getSchema() {
        const columnSchema: DataModel.ColumnSchema[] = [
            {
                name: 'name',
                header: 'Name',
            },
            {
                name: 'type',
                header: 'Type',
            },
            {
                name: 'color',
                header : 'Color',
            },
            {
                name: 'age',
                header: 'Age',
            },
            {
                name: 'receiveDate',
                header: 'Receive Date',
            },
            {
                name: 'favoriteFood',
                header: 'Favorite Food',
            },
            {
                name: 'restrictMovement',
                header: 'Restrict Movement',
            },
        ];
        return columnSchema;
    }

    getValue(columnIndex: number, rowIndex: number) {
        const record = data[rowIndex];
        const fieldName = this.columnIndexToFieldName(columnIndex);
        return record[fieldName];
    }

    private columnIndexToFieldName(columnIndex: number): keyof Record {
        switch (columnIndex) {
            case 0: return 'name';
            case 1: return 'type';
            case 2: return 'color';
            case 3: return 'age';
            case 4: return 'receiveDate';
            case 5: return 'favoriteFood';
            case 6: return 'restrictMovement';
            default:
                throw new Error(`Out of range column index: ${columnIndex}`);
        }
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

export type Data = Record[];

const data: Data = [
    {
        name: 'Rover',
        type: 'Dog',
        color: 'red',
        age: 5,
        receiveDate: new Date('2020-03-04'),
        favoriteFood: 'meat',
        restrictMovement: true,
    },
    {
        name: 'Moggie',
        type: 'Cat',
        color: 'white and black',
        age: 7,
        receiveDate: new Date('2019-09-04'),
        favoriteFood: 'gravied meat',
        restrictMovement: false,
    },
    {
        name: 'Tweets',
        type: 'Canary',
        color: 'yellow',
        age: 0.5,
        receiveDate: new Date('2021-05-06'),
        favoriteFood: 'pellets',
        restrictMovement: true,
    },
]
