import { RevRecordField, RevRecordHeaderAdapter, StandardInMemoryBehavioredColumnSettings } from '..';
import { GridField } from './grid-field';

export class RecordHeaderAdapter extends RevRecordHeaderAdapter {
    override getValue(schemaColumn: RevRecordField.SchemaColumn<StandardInMemoryBehavioredColumnSettings>): string {
        const field = schemaColumn.field as GridField;
        return field.heading;
    }
}
