import { DataServer } from '..';
import { AppSchemaServer } from './app-schema-server';

export class HeaderDataServer implements DataServer<AppSchemaServer.Field> {
    getRowCount() {
        return 1;
    }

    getViewValue(field: AppSchemaServer.Field) {
        return field.header;
    }

    subscribeDataNotifications() {
        // not used
    }
}
