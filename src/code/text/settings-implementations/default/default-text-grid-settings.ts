import { defaultGridSettings } from '../../../settings-implementations/settings-implementations-public-api';
import { TextGridSettings } from '../../settings/text-settings-public-api';
import { defaultTextOnlyGridSettings } from './default-text-only-grid-settings';

/** @public */
export const defaultTextGridSettings: TextGridSettings = {
    ...defaultGridSettings,
    ...defaultTextOnlyGridSettings,
} as const;
