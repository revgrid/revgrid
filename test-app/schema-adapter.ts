import { MainRecord } from 'main-record';
import { ColumnSettings, SchemaServer } from '..';

export class SchemaServerImplementation implements SchemaServer {
    private notificationsClient: SchemaServer.NotificationsClient;

    getSchema() {
        return SchemaServerImplementation.schema;
    }

    subscribeSchemaNotifications(client: SchemaServer.NotificationsClient) {
        this.notificationsClient = client;

        this.notificationsClient.schemaChanged();
    }
}

export namespace SchemaServerImplementation {
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
