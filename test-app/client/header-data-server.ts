import { RevDataServer } from '../..';
import { AppSchemaField } from './app-schema-field';

export class HeaderDataServer implements RevDataServer<AppSchemaField> {
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
