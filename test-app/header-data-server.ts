import { DataServer } from '..';
import { SchemaServerImplementation } from './schema-server-implementation';

export class HeaderDataServer implements DataServer<SchemaServerImplementation.Field> {
    getRowCount() {
        return 1;
    }

    getViewValue(field: SchemaServerImplementation.Field) {
        return field.header;
    }

    subscribeDataNotifications() {
        // not used
    }
}
