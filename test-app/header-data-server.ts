import { DataServer } from '..';
import { AppSchemaField } from './app-schema-field';

export class HeaderDataServer implements DataServer<AppSchemaField> {
    getRowCount() {
        return 1;
    }

    getViewValue(field: AppSchemaField) {
        return field.header;
    }

    subscribeDataNotifications() {
        // not used
    }
}
