import { CellEditor, CellPainter, Column, DataServer, DatalessViewCell, SchemaServer, TextCellPainter } from '..';
import { MainRecord } from './main-record';
import { SchemaServerImplementation } from './schema-adapter';

export class MainDataServer implements DataServer {
    readonly cellPainter: TextCellPainter;

    private readonly _data: MainRecord[] = [];
    private _fishCreateCount = 0;
    private _notificationsClient: DataServer.NotificationsClient;

    constructor() {
        this.cellPainter = new TextCellPainter(this);

        const initialDataCount = MainDataServer.initialData.length;
        this._data.length = initialDataCount;
        for (let i = 0; i < initialDataCount; i++) {
            const record = MainDataServer.initialData[i];
            record.receiveDate = this.calculateReceiveDate(record.age);
            this._data[i] = record;
        }
    }

    subscribeDataNotifications(client: DataServer.NotificationsClient) {
        this._notificationsClient = client;

        const existingRecordCount = this._data.length;
        if (existingRecordCount > 0) {
            client.rowsInserted(0, existingRecordCount);
        }
    }

    getRowCount() {
        return this._data.length;
    }

    getValue(columnSchema: SchemaServer.Column, rowIndex: number) {
        const record = this._data[rowIndex];
        const fieldName = (columnSchema as SchemaServerImplementation.Column).name;
        return record[fieldName];
    }

    getRowId(rowIndex: number): number {
        return this._data[rowIndex].id;
    }

    getTitleText(columnSchema: SchemaServer.Column, rowIndex: number) {
        const record = this._data[rowIndex];
        const fieldName = (columnSchema as SchemaServerImplementation.Column).name;
        const prefix = fieldName + ': '
        switch (fieldName) {
            case 'id': return prefix + record.id.toString();
            case 'name': return prefix + record.name;
            case 'type': return prefix + record.type;
            case 'color': return prefix + record.color;
            case 'age': return prefix + record.age.toString();
            case 'receiveDate': return prefix + record.receiveDate.toDateString();
            case 'favoriteFood': return prefix + record.favoriteFood;
            case 'restrictMovement': return prefix + record.restrictMovement ? 'true' : 'false';
            default:
                throw new Error(`Unexpected field name: ${fieldName}`);
        }

    }

    getCellPainter(viewCell: DatalessViewCell, cellEditorPainter: CellEditor.Painter | undefined): CellPainter {
        this.cellPainter.setCell(viewCell, cellEditorPainter);
        return this.cellPainter;
    }

    sort(column: Column) {
        this._notificationsClient.preReindex();
        try {
            const schemaColumn = column.schemaColumn as SchemaServerImplementation.Column;
            this._data.sort((left: MainRecord, right: MainRecord) => MainRecord.compareField(schemaColumn.name, left, right));
            this._notificationsClient.invalidateAll();
        } finally {
            this._notificationsClient.postReindex();
        }
    }

    deleteRow(rowIndex: number) {
        this._data.splice(rowIndex, 1);
        this._notificationsClient.rowsDeleted(rowIndex, 1);
    }

    addFish() {
        const insertCount = 20;
        const insertIndex = this._data.length;
        let index = insertIndex;
        this._data.length += insertCount;
        for (let i = 0; i < insertCount; i++) {
            const record = this.createFishRecord(index);
            this._data[index++] = record;
        }

        this._notificationsClient.rowsInserted(insertIndex, insertCount);
    }

    private createFishRecord(index: number): MainRecord {
        const age = Math.round(0.2 + Math.random() * 100) / 100;
        const receiveDate = this.calculateReceiveDate(age);
        return {
            id: index,
            name: 'Bubbles' + (++this._fishCreateCount).toString(),
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

export namespace MainDataServer {
    const dummyDate = new Date();

    export const initialData: MainRecord[] = [
        {
            id: 0,
            name: 'Rover',
            type: 'Dog',
            color: 'red',
            age: 5,
            receiveDate: dummyDate,
            favoriteFood: 'meat',
            restrictMovement: true,
        },
        {
            id: 1,
            name: 'Moggie',
            type: 'Cat',
            color: 'white and black',
            age: 7,
            receiveDate: dummyDate,
            favoriteFood: 'gravied meat',
            restrictMovement: false,
        },
        {
            id: 2,
            name: 'Tweets',
            type: 'Canary',
            color: 'yellow',
            age: 0.5,
            receiveDate: dummyDate,
            favoriteFood: 'pellets',
            restrictMovement: true,
        },
    ];
}
