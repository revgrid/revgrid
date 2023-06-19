import { SchemaField, StandardInMemoryBehavioredColumnSettings } from '..';
import { MainRecord } from './main-record';

export interface AppSchemaField extends SchemaField {
    name: keyof MainRecord;
    columnSettings: StandardInMemoryBehavioredColumnSettings;
    header: string;
}
