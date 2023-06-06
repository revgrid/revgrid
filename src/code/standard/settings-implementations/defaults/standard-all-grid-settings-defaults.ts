import { gridSettingsDefaults } from '../../../settings-implementations/settings-implementations-public-api';
import { StandardAllGridSettings } from '../../settings/standard-settings-public-api';
import { standardGridSettingsDefaults } from './standard-grid-settings-defaults';

/** @public */
export const standardAllGridSettingsDefaults: StandardAllGridSettings = {
    ...gridSettingsDefaults,
    ...standardGridSettingsDefaults,
};
