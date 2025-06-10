import { RevSchemaField } from '../..';
import { MainRecord } from './main-record';

export interface AppSchemaField extends RevSchemaField {
    name: keyof MainRecord;
    header: string;
}
