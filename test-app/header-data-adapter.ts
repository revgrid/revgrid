import { DataModel, SchemaModel } from '..';
import { SchemaAdapter } from './schema-adapter';

export class HeaderDataAdapter implements DataModel {
    getRowCount() {
        return 1;
    }

    getValue(schemaColumn: SchemaModel.Column) {
        return (schemaColumn as SchemaAdapter.Column).header;
    }

    addDataCallbackListener() {
        // not used
    }
}
