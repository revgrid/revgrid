import { RevBehavioredColumnSettings } from '../../client';
import { revDefaultColumnSettings, revDefaultGridSettings } from '../default';
import { revReadonlyBehavioredSettings } from './readonly-behaviored-settings';

/** @public */
export const revReadonlyDefaultBehavioredColumnSettings: Readonly<RevBehavioredColumnSettings> = {
    gridSettings: revDefaultGridSettings,
    ...revDefaultColumnSettings,
    ...revReadonlyBehavioredSettings,
    merge: () => false,
    clone: () => { return revReadonlyDefaultBehavioredColumnSettings; }
} as const;
