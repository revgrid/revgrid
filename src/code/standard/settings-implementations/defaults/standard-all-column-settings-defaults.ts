import { columnSettingsDefaults } from '../../../settings-implementations/settings-implementations-public-api';
import { StandardAllColumnSettings } from '../../settings/standard-settings-public-api';
import { standardColumnSettingsDefaults } from './standard-column-settings-defaults';

/** @public */
export const standardAllColumnSettingsDefaults: StandardAllColumnSettings = {
    ...columnSettingsDefaults,
    ...standardColumnSettingsDefaults,
};
