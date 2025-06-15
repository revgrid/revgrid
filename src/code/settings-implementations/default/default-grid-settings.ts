import { RevGridSettings } from '../../client';
import { revDefaultOnlyGridSettings } from './default-only-grid-settings';

/** @public */
export const revDefaultGridSettings: RevGridSettings = {
    ...revDefaultOnlyGridSettings,
} as const;
