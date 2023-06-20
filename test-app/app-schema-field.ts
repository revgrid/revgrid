import { SchemaField, StandardBehavioredColumnSettings } from '..';
import { MainRecord } from './main-record';

export interface AppSchemaField extends SchemaField<StandardBehavioredColumnSettings> {
    name: keyof MainRecord;
    columnSettings: StandardBehavioredColumnSettings;
    header: string;
}
