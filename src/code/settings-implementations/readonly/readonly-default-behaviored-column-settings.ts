import { RevBehavioredColumnSettings } from '../../client/internal-api';
import { revDefaultColumnSettings, revDefaultGridSettings } from '../default/internal-api';
import { revReadonlyBehavioredSettings } from './readonly-behaviored-settings';

/** @public */
export const revReadonlyDefaultBehavioredColumnSettings: Readonly<RevBehavioredColumnSettings> = {
    gridSettings: revDefaultGridSettings,
    ...revDefaultColumnSettings,
    ...revReadonlyBehavioredSettings,
    merge: () => false,
    clone: () => { return revReadonlyDefaultBehavioredColumnSettings; }
} as const;
