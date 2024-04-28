import { RevColumnSettings } from '../../client/internal-api';
import { revDefaultOnlyColumnSettings } from './default-only-column-settings';

/** @public */
export const revDefaultColumnSettings: RevColumnSettings = {
    ...revDefaultOnlyColumnSettings,
} as const;
