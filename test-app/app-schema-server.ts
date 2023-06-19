import { SchemaServer, StandardAllGridSettings, StandardInMemoryBehavioredColumnSettings, standardAllColumnSettingsDefaults } from '..';
import { AppSchemaField } from './app-schema-field';
import { MainRecord } from './main-record';

export class AppSchemaServer implements SchemaServer<StandardInMemoryBehavioredColumnSettings, AppSchemaField> {
    private readonly _schema: AppSchemaField[];

    readonly nameSchemaSchemaField: AppSchemaField;
    readonly typeSchemaSchemaField: AppSchemaField;
    readonly colorSchemaSchemaField: AppSchemaField;
    readonly ageSchemaSchemaField: AppSchemaField;
    readonly receiveDateSchemaField: AppSchemaField;
    readonly favoriteFoodSchemaField: AppSchemaField;
    readonly restrictMovementSchemaField: AppSchemaField;

    private notificationsClient: SchemaServer.NotificationsClient<AppSchemaField>;

    constructor(gridSettings: StandardAllGridSettings) {
        const nameHeaders = AppSchemaServer.columnNameHeaders;
        const columnCount = nameHeaders.length;
        const schema = new Array<AppSchemaField>(columnCount);
        for (let i = 0; i < columnCount; i++) {
            const nameHeader = nameHeaders[i];
            const name = nameHeader.name;
            const columnSettings = new StandardInMemoryBehavioredColumnSettings(gridSettings);
            columnSettings.load(standardAllColumnSettingsDefaults);
            const field: AppSchemaField = {
                name,
                index: i,
                columnSettings,
                header: nameHeader.header,
            };

            switch (name) {
                case 'id':
                    throw new Error('Id field is not exported as a schema column')
                case 'name':
                    this.nameSchemaSchemaField = field;
                    break;
                case 'type':
                    this.typeSchemaSchemaField = field;
                    break;
                case 'color':
                    this.colorSchemaSchemaField = field;
                    break;
                case 'age':
                    this.ageSchemaSchemaField = field;
                    break;
                case 'receiveDate':
                    this.receiveDateSchemaField = field;
                    break;
                case 'favoriteFood':
                    this.favoriteFoodSchemaField = field;
                    break;
                case 'restrictMovement':
                    this.restrictMovementSchemaField = field;
                    break;
                default:
                    name satisfies never;
            }

            schema[i] = field;
        }

        this._schema = schema;
    }

    getFields() {
        return this._schema;
    }

    getFieldColumnSettings(field: AppSchemaField): StandardInMemoryBehavioredColumnSettings {
        return field.columnSettings;
    }

    subscribeSchemaNotifications(client: SchemaServer.NotificationsClient<AppSchemaField>) {
        this.notificationsClient = client;

        this.notificationsClient.schemaChanged();
    }
}

export namespace AppSchemaServer {
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
