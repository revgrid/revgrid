import { defaultGridSettings } from '../../../settings-implementations/settings-implementations-public-api';
import { StandardAllGridSettings } from '../../settings/standard-settings-public-api';
import { defaultStandardGridSettings } from './default-standard-grid-settings';

/** @public */
export const defaultStandardAllGridSettings: StandardAllGridSettings = {
    ...defaultGridSettings,
    ...defaultStandardGridSettings,
} as const;
