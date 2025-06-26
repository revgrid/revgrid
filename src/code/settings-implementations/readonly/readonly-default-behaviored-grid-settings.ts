import { RevBehavioredGridSettings } from '../../client';
import { revDefaultGridSettings } from '../default';
import { revReadonlyBehavioredSettings } from './readonly-behaviored-settings';

/** @public */
export const revReadonlyDefaultBehavioredGridSettings: Readonly<RevBehavioredGridSettings> = {
    ...revDefaultGridSettings,
    ...revReadonlyBehavioredSettings,
    merge: () => false,
    clone: () => { return revReadonlyDefaultBehavioredGridSettings; }
} as const;
