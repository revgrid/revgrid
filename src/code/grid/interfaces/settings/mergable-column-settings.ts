import { ColumnSettings } from './column-settings';

export interface MergableColumnSettings extends ColumnSettings {
    merge(properties: Partial<ColumnSettings>): void;
}
