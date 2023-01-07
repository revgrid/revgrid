import { RevRecordField, RevRecordHeaderAdapter } from '..';
import { GridField } from './grid-field';

export class RecordHeaderAdapter extends RevRecordHeaderAdapter {
    override getValue(schemaColumn: RevRecordField.SchemaColumn): string {
        const field = schemaColumn.field as GridField;
        return field.heading;
    }
}
