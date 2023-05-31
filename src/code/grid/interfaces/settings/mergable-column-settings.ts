import { ColumnSettings } from './column-settings';

/** @public */
export interface MergableColumnSettings extends ColumnSettings {
    merge(properties: Partial<ColumnSettings>): void;
}
