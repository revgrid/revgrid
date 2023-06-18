import { StandardBehavioredColumnSettings } from '../../settings/standard-settings-public-api';
import { standardAllColumnSettingsDefaults } from '../defaults/standard-settings-implementations-defaults-public-api';
import { standardReadonlyGridSettingsBehavior } from './standard-readonly-grid-settings-behavior';

/** @public */
export const standardReadonlyDefaultBehavioredColumnSettings: StandardBehavioredColumnSettings = {
    ...standardAllColumnSettingsDefaults,
    ...standardReadonlyGridSettingsBehavior,
}
