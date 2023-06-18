import { standardAllGridSettingsDefaults } from '../dist/types/public-api';
import { AppAllGridSettings } from './app-all-grid-settings';
import { appGridSettingsDefaults } from './app-grid-settings-defaults';

/** @public */
export const appAllGridSettingsDefaults: AppAllGridSettings = {
    ...standardAllGridSettingsDefaults,
    ...appGridSettingsDefaults,
};
