import { BehavioredColumnSettings } from '../../grid/grid-public-api';
import { columnSettingsDefaults } from '../defaults/settings-implementations-defaults-public-api';
import { readonlyColumnSettingsBehavior } from './readonly-column-settings-behavior';

/** @public */
export const readonlyDefaultBehavioredColumnSettings: BehavioredColumnSettings = {
    ...columnSettingsDefaults,
    ...readonlyColumnSettingsBehavior,
}
