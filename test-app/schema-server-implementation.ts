import { SchemaServer, StandardInMemoryBehavioredColumnSettings, standardAllColumnSettingsDefaults } from '..';
import { MainRecord } from './main-record';

export class SchemaServerImplementation implements SchemaServer<StandardInMemoryBehavioredColumnSettings, SchemaServerImplementation.Column> {
    private readonly _schema: SchemaServerImplementation.Column[];
    private notificationsClient: SchemaServer.NotificationsClient<StandardInMemoryBehavioredColumnSettings>;

    constructor() {
        const nameHeaders = SchemaServerImplementation.columnNameHeaders;
        const columnCount = nameHeaders.length;
        const schema = new Array<SchemaServerImplementation.Column>(columnCount);
        for (let i = 0; i < columnCount; i++) {
            const nameHeader = nameHeaders[i];
            const settings = new StandardInMemoryBehavioredColumnSettings();
            settings.load(standardAllColumnSettingsDefaults);
            schema[i] = {
                name: nameHeader.name,
                index: i,
                settings,
                header: nameHeader.header,
            };
        }

        this._schema = schema;
    }

    getSchema() {
        return this._schema;
    }

    subscribeSchemaNotifications(client: SchemaServer.NotificationsClient<StandardInMemoryBehavioredColumnSettings>) {
        this.notificationsClient = client;

        this.notificationsClient.schemaChanged();
    }
}

export namespace SchemaServerImplementation {
    export interface Column extends SchemaServer.Column<StandardInMemoryBehavioredColumnSettings> {
        name: keyof MainRecord;
        settings: StandardInMemoryBehavioredColumnSettings;
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
