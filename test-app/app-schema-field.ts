import { SchemaField } from '..';
import { MainRecord } from './main-record';

export interface AppSchemaField extends SchemaField {
    name: keyof MainRecord;
    header: string;
}
