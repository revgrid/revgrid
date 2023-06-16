import { BehavioredGridSettings } from '../../grid/grid-public-api';
import { gridSettingsDefaults } from '../defaults/settings-implementations-defaults-public-api';
import { readonlyGridSettingsBehavior } from './readonly-grid-settings-behavior';

/** @public */
export const readonlyDefaultBehavioredGridSettings: BehavioredGridSettings = {
    ...gridSettingsDefaults,
    ...readonlyGridSettingsBehavior,
}
