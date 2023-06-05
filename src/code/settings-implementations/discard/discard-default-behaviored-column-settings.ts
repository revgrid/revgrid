import { BehavioredColumnSettings } from '../../grid/grid-public-api';
import { columnSettingsDefaults } from '../defaults/settings-implementations-defaults-public-api';
import { discardColumnSettingsBehavior } from './discard-column-settings-behavior';

/** @public */
export const discardDefaultBehavioredColumnSettings: BehavioredColumnSettings = {
    ...columnSettingsDefaults,
    ...discardColumnSettingsBehavior,
}
