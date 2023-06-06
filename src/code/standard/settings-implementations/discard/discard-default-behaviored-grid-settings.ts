import { discardGridSettingsBehavior } from '../../../settings-implementations/discard/settings-implementations-discard-public-api';
import { StandardBehavioredGridSettings } from '../../settings/standard-settings-public-api';
import { standardAllGridSettingsDefaults } from '../defaults/standard-settings-implementations-defaults-public-api';

/** @public */
export const standardDiscardDefaultBehavioredGridSettings: StandardBehavioredGridSettings = {
    ...standardAllGridSettingsDefaults,
    ...discardGridSettingsBehavior,
}
