import { revDefaultGridSettings } from '../../../settings-implementations/internal-api';
import { RevStandardGridSettings } from '../../settings/internal-api';
import { revStandardDefaultOnlyGridSettings } from './standard-default-only-grid-settings';

/** @public */
export const revStandardDefaultGridSettings: RevStandardGridSettings = {
    ...revDefaultGridSettings,
    ...revStandardDefaultOnlyGridSettings,
} as const;
