import { InMemoryStandardBehavioredColumnSettings, SchemaField } from '..';
import { MainRecord } from './main-record';

export interface AppSchemaField extends SchemaField<BCS> {
    name: keyof MainRecord;
    columnSettings: InMemoryStandardBehavioredColumnSettings;
    header: string;
}
