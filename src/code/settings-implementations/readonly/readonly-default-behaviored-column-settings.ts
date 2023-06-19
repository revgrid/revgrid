import { BehavioredColumnSettings } from '../../grid/grid-public-api';
import { columnSettingsDefaults } from '../defaults/settings-implementations-defaults-public-api';
import { readonlyGridSettingsBehavior } from './readonly-grid-settings-behavior';

/** @public */
export const readonlyDefaultBehavioredColumnSettings: BehavioredColumnSettings = {
    ...columnSettingsDefaults,
    ...readonlyGridSettingsBehavior,
}
