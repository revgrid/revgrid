import { revSimpleDefaultGridSettings } from '../..';
import { AppGridSettings } from './app-grid-settings';
import { defaultAppOnlyGridSettings } from './default-app-only-grid-settings';

/** @public */
export const defaultAppGridSettings: AppGridSettings = {
    ...revSimpleDefaultGridSettings,
    ...defaultAppOnlyGridSettings,
} as const;
