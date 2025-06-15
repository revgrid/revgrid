import { RevBehavioredGridSettings } from '../../client';
import { revDefaultGridSettings } from '../default/internal-api';
import { revReadonlyBehavioredSettings } from './readonly-behaviored-settings';

/** @public */
export const revReadonlyDefaultBehavioredGridSettings: Readonly<RevBehavioredGridSettings> = {
    ...revDefaultGridSettings,
    ...revReadonlyBehavioredSettings,
    merge: () => false,
    clone: () => { return revReadonlyDefaultBehavioredGridSettings; }
} as const;
