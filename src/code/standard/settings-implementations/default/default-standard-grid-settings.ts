import { defaultGridSettings } from '../../../settings-implementations/settings-implementations-public-api';
import { StandardGridSettings } from '../../settings/standard-settings-public-api';
import { defaultStandardOnlyGridSettings } from './default-standard-only-grid-settings';

/** @public */
export const defaultStandardGridSettings: StandardGridSettings = {
    ...defaultGridSettings,
    ...defaultStandardOnlyGridSettings,
} as const;
