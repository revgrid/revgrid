import { DataServer, SchemaServer, StandardInMemoryBehavioredColumnSettings } from '..';
import { SchemaServerImplementation } from './schema-adapter';

export class HeaderDataServer implements DataServer<StandardInMemoryBehavioredColumnSettings> {
    getRowCount() {
        return 1;
    }

    getValue(schemaColumn: SchemaServer.Column<StandardInMemoryBehavioredColumnSettings>) {
        return (schemaColumn as SchemaServerImplementation.Column).header;
    }

    subscribeDataNotifications() {
        // not used
    }
}
