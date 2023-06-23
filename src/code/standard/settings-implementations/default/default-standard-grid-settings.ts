import { defaultTextGridSettings } from '../../../text/text-public-api';
import { StandardGridSettings } from '../../settings/standard-settings-public-api';
import { defaultStandardOnlyGridSettings } from './default-standard-only-grid-settings';

/** @public */
export const defaultStandardGridSettings: StandardGridSettings = {
    ...defaultTextGridSettings,
    ...defaultStandardOnlyGridSettings,
} as const;
