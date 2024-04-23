import { defaultGridSettings } from '../../../settings-implementations/internal-api';
import { StandardGridSettings } from '../../settings/internal-api';
import { defaultStandardOnlyGridSettings } from './default-standard-only-grid-settings';

/** @public */
export const defaultStandardGridSettings: StandardGridSettings = {
    ...defaultGridSettings,
    ...defaultStandardOnlyGridSettings,
} as const;
