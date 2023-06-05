import { BehavioredGridSettings } from '../../grid/grid-public-api';
import { gridSettingsDefaults } from '../defaults/settings-implementations-defaults-public-api';
import { discardGridSettingsBehavior } from './discard-grid-settings-behavior';

/** @public */
export const discardDefaultBehavioredGridSettings: BehavioredGridSettings = {
    ...gridSettingsDefaults,
    ...discardGridSettingsBehavior,
}
