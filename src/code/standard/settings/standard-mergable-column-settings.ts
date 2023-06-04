import { ColumnSettingsMerge } from '../../grid/grid-public-api';
import { StandardAllColumnSettings } from './standard-all-column-settings';
import { StandardMergableGridSettings } from './standard-mergable-grid-settings';

/** @public */
export interface StandardMergableColumnSettings extends StandardAllColumnSettings, ColumnSettingsMerge {
    gridSettings: StandardMergableGridSettings
}

