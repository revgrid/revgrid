import { RevColumn, RevDataServer, StandardBehavioredColumnSettings } from '..';
import { AppSchemaField } from './app-schema-field';
import { MainRecord } from './main-record';

export class MainDataServer implements RevDataServer<AppSchemaField> {
    private readonly _data: MainRecord[] = [];
    private _fishCreateCount = 0;
    private _notificationsClient: RevDataServer.NotificationsClient;

    constructor() {
        const initialDataCount = MainDataServer.initialData.length;
        this._data.length = initialDataCount;
        for (let i = 0; i < initialDataCount; i++) {
            const record = MainDataServer.initialData[i];
            record.receiveDate = this.calculateReceiveDate(record.age);
            this._data[i] = record;
        }
    }

    subscribeDataNotifications(client: RevDataServer.NotificationsClient) {
        this._notificationsClient = client;

        const existingRecordCount = this._data.length;
        if (existingRecordCount > 0) {
            client.rowsInserted(0, existingRecordCount);
        }
    }

    getRowCount() {
        return this._data.length;
    }

    getViewValue(field: AppSchemaField, rowIndex: number) {
        const record = this._data[rowIndex];
        const fieldName = field.name;
        return record[fieldName].toLocaleString();
    }

    getEditValue(field: AppSchemaField, rowIndex: number) {
        const record = this._data[rowIndex];
        const fieldName = field.name;
        return record[fieldName];
    }

    setEditValue(field: AppSchemaField, rowIndex: number, value: RevDataServer.EditValue) {
        const record = this._data[rowIndex];
        const fieldName = field.name;
        switch (fieldName) {
            case 'id':
                throw new Error('Id is not exported as a Schema Column');
            case 'name':
                record.name = value as string;
                break;
            case 'type':
                record.type = value as string;
                break;
            case 'color':
                record.color = value as string;
                break;
            case 'age':
                record.age = value as number;
                break;
            case 'receiveDate':
                record.receiveDate = value as Date;
                break;
            case 'favoriteFood':
                record.favoriteFood = value as string;
                break;
            case 'restrictMovement':
                record.restrictMovement = value as boolean;
                break;
            default:
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new Error(`Unexpected field name: ${fieldName}`);
        }
        this._notificationsClient.invalidateCell(field.index, rowIndex);
    }

    getRowIdFromIndex(rowIndex: number): number {
        return this._data[rowIndex].id;
    }

    getRowIndexFromId(rowId: unknown): number | undefined {
        const recordCount = this._data.length;
        for (let i = 0; i < recordCount; i++) {
            const record = this._data[i];
            if (record.id === rowId) {
                return i;
            }
        }
        return undefined;
    }

    getTitleText(field: AppSchemaField, rowIndex: number) {
        const record = this._data[rowIndex];
        const fieldName = field.name;
        const prefix = fieldName + ': '
        switch (fieldName) {
            case 'id': return prefix + record.id.toString();
            case 'name': return prefix + record.name;
            case 'type': return prefix + record.type;
            case 'color': return prefix + record.color;
            case 'age': return prefix + record.age.toString();
            case 'receiveDate': return prefix + record.receiveDate.toDateString();
            case 'favoriteFood': return prefix + record.favoriteFood;
            case 'restrictMovement': return prefix + (record.restrictMovement ? 'true' : 'false');
            default:
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new Error(`Unexpected field name: ${fieldName}`);
        }
    }

    sort(column: RevColumn<StandardBehavioredColumnSettings, AppSchemaField>) {
        this._notificationsClient.preReindex();
        try {
            const field = column.field;
            this._data.sort((left: MainRecord, right: MainRecord) => MainRecord.compareField(field.name, left, right));
            this._notificationsClient.invalidateAll();
        } finally {
            this._notificationsClient.postReindex(true);
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
