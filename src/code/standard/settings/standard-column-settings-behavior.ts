import { ColumnSettingsBehavior } from '../../grid/grid-public-api';
import { StandardAllColumnSettings } from './standard-all-column-settings';

/** @public */
export interface StandardColumnSettingsBehavior extends ColumnSettingsBehavior {
    load(settings: StandardAllColumnSettings): void;
}
