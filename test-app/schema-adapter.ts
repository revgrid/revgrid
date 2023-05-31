import { MainRecord } from 'main-record';
import { MergableGridSettings, SchemaServer } from '..';
import { TestAppMergableColumnSettings } from './test-app-mergable-column-settings';

export class SchemaServerImplementation implements SchemaServer {
    private readonly _schema: SchemaServerImplementation.Column[];
    private notificationsClient: SchemaServer.NotificationsClient;

    constructor(private readonly _gridSettings: MergableGridSettings) {
        const nameHeaders = SchemaServerImplementation.columnNameHeaders;
        const columnCount = nameHeaders.length;
        const schema = new Array<SchemaServerImplementation.Column>(columnCount);
        for (let i = 0; i < columnCount; i++) {
            const nameHeader = nameHeaders[i];
            schema[i] = {
                name: nameHeader.name,
                index: i,
                settings: new TestAppMergableColumnSettings(this._gridSettings, undefined),
                header: nameHeader.header,
            };
        }

        this._schema = schema;
    }

    getSchema() {
        return this._schema;
    }

    subscribeSchemaNotifications(client: SchemaServer.NotificationsClient) {
        this.notificationsClient = client;

        this.notificationsClient.schemaChanged();
    }
}

export namespace SchemaServerImplementation {
    export interface Column extends SchemaServer.Column {
        name: keyof MainRecord;
        settings: TestAppMergableColumnSettings;
        header: string;
    }

    export interface ColumnNameHeader {
        name: keyof MainRecord;
        header: string;
    }

    export const columnNameHeaders: ColumnNameHeader[] = [
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
}
