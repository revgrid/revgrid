import { RevColumnSettings } from '../../client';
import { revDefaultOnlyColumnSettings } from './default-only-column-settings';

/** @public */
export const revDefaultColumnSettings: RevColumnSettings = {
    ...revDefaultOnlyColumnSettings,
} as const;
