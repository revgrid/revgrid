import { RevSchemaServer } from '../..';
import { AppSchemaField } from './app-schema-field';
import { MainRecord } from './main-record';

export class AppSchemaServer implements RevSchemaServer<AppSchemaField> {
    readonly nameSchemaSchemaField: AppSchemaField;
    readonly typeSchemaSchemaField: AppSchemaField;
    readonly colorSchemaSchemaField: AppSchemaField;
    readonly ageSchemaSchemaField: AppSchemaField;
    readonly receiveDateSchemaField: AppSchemaField;
    readonly favoriteFoodSchemaField: AppSchemaField;
    readonly restrictMovementSchemaField: AppSchemaField;

    private readonly _schema: AppSchemaField[];

    private notificationsClient: RevSchemaServer.NotificationsClient<AppSchemaField>;

    constructor() {
        const nameHeaders = AppSchemaServer.columnNameHeaders;
        const columnCount = nameHeaders.length;
        const schema = new Array<AppSchemaField>(columnCount);
        for (let i = 0; i < columnCount; i++) {
            const nameHeader = nameHeaders[i];
            const name = nameHeader.name;
            const field: AppSchemaField = {
                name,
                index: i,
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

    subscribeSchemaNotifications(client: RevSchemaServer.NotificationsClient<AppSchemaField>) {
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
