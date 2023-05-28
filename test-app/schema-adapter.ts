import { MainRecord } from 'main-record';
import { ColumnSettings, SchemaServer } from '..';

export class SchemaAdapter implements SchemaServer {
    private _callbackListener: SchemaServer.NotificationsClient;

    getSchema() {
        return SchemaAdapter.schema;
    }

    subscribeNotifications(listener: SchemaServer.NotificationsClient) {
        this._callbackListener = listener;

        this._callbackListener.schemaChanged();
    }
}

export namespace SchemaAdapter {
    export interface Column extends SchemaServer.Column {
        name: keyof MainRecord;
        index: number;
        header: string;
    }

    const initialSettings: Partial<ColumnSettings> | undefined = undefined;

    export const schema: Column[] = [
        {
            name: 'name',
            index: 0,
            header: 'Name',
            initialSettings,
        },
        {
            name: 'type',
            index: 1,
            header: 'Type',
            initialSettings,
        },
        {
            name: 'color',
            index: 2,
            header : 'Color',
            initialSettings,
        },
        {
            name: 'age',
            index: 3,
            header: 'Age',
            initialSettings,
        },
        {
            name: 'receiveDate',
            index: 4,
            header: 'Receive Date',
            initialSettings,
        },
        {
            name: 'favoriteFood',
            index: 5,
            header: 'Favorite Food',
            initialSettings,
        },
        {
            name: 'restrictMovement',
            index: 6,
            header: 'Restrict Movement',
            initialSettings,
        },
    ];
}
