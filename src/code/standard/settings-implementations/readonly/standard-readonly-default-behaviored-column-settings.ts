import { readonlyColumnSettingsBehavior } from '../../../settings-implementations/settings-implementations-public-api';
import { StandardBehavioredColumnSettings } from '../../settings/standard-settings-public-api';
import { standardAllColumnSettingsDefaults } from '../defaults/standard-settings-implementations-defaults-public-api';

/** @public */
export const standardReadonlyDefaultBehavioredColumnSettings: StandardBehavioredColumnSettings = {
    ...standardAllColumnSettingsDefaults,
    ...readonlyColumnSettingsBehavior,
}
