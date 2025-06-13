import { RevGridSettings } from '../../client/internal-api';
import { revDefaultOnlyGridSettings } from './default-only-grid-settings';

/** @public */
export const revDefaultGridSettings: RevGridSettings = {
    ...revDefaultOnlyGridSettings,
} as const;
