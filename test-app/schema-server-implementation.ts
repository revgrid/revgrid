import { SchemaServer, StandardInMemoryBehavioredColumnSettings, standardAllColumnSettingsDefaults } from '..';
import { MainRecord } from './main-record';

export class SchemaServerImplementation implements SchemaServer<StandardInMemoryBehavioredColumnSettings, SchemaServerImplementation.Column> {
    private readonly _schema: SchemaServerImplementation.Column[];

    readonly nameSchemaColumn: SchemaServerImplementation.Column;
    readonly typeSchemaColumn: SchemaServerImplementation.Column;
    readonly colorSchemaColumn: SchemaServerImplementation.Column;
    readonly ageSchemaColumn: SchemaServerImplementation.Column;
    readonly receiveDateSchemaColumn: SchemaServerImplementation.Column;
    readonly favoriteFoodSchemaColumn: SchemaServerImplementation.Column;
    readonly restrictMovementSchemaColumn: SchemaServerImplementation.Column;

    private notificationsClient: SchemaServer.NotificationsClient<StandardInMemoryBehavioredColumnSettings>;

    constructor() {
        const nameHeaders = SchemaServerImplementation.columnNameHeaders;
        const columnCount = nameHeaders.length;
        const schema = new Array<SchemaServerImplementation.Column>(columnCount);
        for (let i = 0; i < columnCount; i++) {
            const nameHeader = nameHeaders[i];
            const name = nameHeader.name;
            const settings = new StandardInMemoryBehavioredColumnSettings();
            settings.load(standardAllColumnSettingsDefaults);
            const column: SchemaServerImplementation.Column = {
                name,
                index: i,
                settings,
                header: nameHeader.header,
            };

            switch (name) {
                case 'id':
                    throw new Error('Id field is not exported as a schema column')
                case 'name':
                    this.nameSchemaColumn = column;
                    break;
                case 'type':
                    this.typeSchemaColumn = column;
                    break;
                case 'color':
                    this.colorSchemaColumn = column;
                    break;
                case 'age':
                    this.ageSchemaColumn = column;
                    break;
                case 'receiveDate':
                    this.receiveDateSchemaColumn = column;
                    break;
                case 'favoriteFood':
                    this.favoriteFoodSchemaColumn = column;
                    break;
                case 'restrictMovement':
                    this.restrictMovementSchemaColumn = column;
                    break;
                default:
                    name satisfies never;
            }

            schema[i] = column;
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
