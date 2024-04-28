import { revDefaultColumnSettings } from '../../../settings-implementations/internal-api';
import { RevStandardColumnSettings } from '../../settings/internal-api';
import { revStandardDefaultOnlyColumnSettings } from './standard-default-only-column-settings';

/** @public */
export const revStandardDefaultColumnSettings: RevStandardColumnSettings = {
    ...revDefaultColumnSettings,
    ...revStandardDefaultOnlyColumnSettings,
} as const;
