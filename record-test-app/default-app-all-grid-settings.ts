import { defaultStandardAllGridSettings } from '..';
import { AppAllGridSettings } from './app-all-grid-settings';
import { defaultAppGridSettings } from './default-app-grid-settings';

/** @public */
export const defaultAppAllGridSettings: AppAllGridSettings = {
    ...defaultStandardAllGridSettings,
    ...defaultAppGridSettings,
} as const;
