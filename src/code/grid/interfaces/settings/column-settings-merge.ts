import { ColumnSettings } from './column-settings';

/** @public */
export interface ColumnSettingsMerge {
    merge(properties: Partial<ColumnSettings>): boolean;
}
