import { DataServer, SchemaServer } from '..';
import { SchemaAdapter } from './schema-adapter';

export class HeaderDataAdapter implements DataServer {
    getRowCount() {
        return 1;
    }

    getValue(schemaColumn: SchemaServer.Column) {
        return (schemaColumn as SchemaAdapter.Column).header;
    }

    subscribeNotifications() {
        // not used
    }
}
