import { DataServer, SchemaServer, StandardInMemoryBehavioredColumnSettings } from '..';
import { SchemaServerImplementation } from './schema-server-implementation';

export class HeaderDataServer implements DataServer<StandardInMemoryBehavioredColumnSettings> {
    getRowCount() {
        return 1;
    }

    getViewValue(schemaColumn: SchemaServer.Column<StandardInMemoryBehavioredColumnSettings>) {
        return (schemaColumn as SchemaServerImplementation.Column).header;
    }

    subscribeDataNotifications() {
        // not used
    }
}
