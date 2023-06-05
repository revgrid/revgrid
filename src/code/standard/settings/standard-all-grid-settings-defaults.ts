import { gridSettingsDefaults } from '../../settings-implementations/settings-implementations-public-api';
import { StandardAllGridSettings } from './standard-all-grid-settings';
import { standardGridSettingsDefaults } from './standard-grid-settings-defaults';

/** @public */
export const standardAllGridSettingsDefaults: StandardAllGridSettings = {
    ...gridSettingsDefaults,
    ...standardGridSettingsDefaults,
};
