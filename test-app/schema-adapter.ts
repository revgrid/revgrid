import { MainRecord } from 'main-record';
import { ColumnSettings, SchemaModel } from '..';

export class SchemaAdapter implements SchemaModel {
    private _callbackListener: SchemaModel.CallbackListener;

    getSchema() {
        return SchemaAdapter.schema;
    }

    addSchemaCallbackListener(listener: SchemaModel.CallbackListener) {
        this._callbackListener = listener;

        this._callbackListener.schemaChanged();
    }
}

export namespace SchemaAdapter {
    export interface Column extends SchemaModel.Column {
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
