import { ColumnSettings } from './column-settings';
import { GridSettingsBehavior } from './grid-settings-behavior';

/** @public */
export interface ColumnSettingsBehavior extends GridSettingsBehavior {
    load(settings: ColumnSettings): void;
}
