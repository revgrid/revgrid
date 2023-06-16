import { readonlyGridSettingsBehavior } from '../../../settings-implementations/readonly/settings-implementations-readonly-public-api';
import { StandardBehavioredGridSettings } from '../../settings/standard-settings-public-api';
import { standardAllGridSettingsDefaults } from '../defaults/standard-settings-implementations-defaults-public-api';

/** @public */
export const standardReadonlyDefaultBehavioredGridSettings: StandardBehavioredGridSettings = {
    ...standardAllGridSettingsDefaults,
    ...readonlyGridSettingsBehavior,
}
