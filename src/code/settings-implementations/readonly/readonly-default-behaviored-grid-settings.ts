import { RevBehavioredGridSettings } from '../../client/internal-api';
import { revDefaultGridSettings } from '../default/internal-api';
import { revReadonlyBehavioredSettings } from './readonly-behaviored-settings';

/** @public */
export const revReadonlyDefaultBehavioredGridSettings: Readonly<RevBehavioredGridSettings> = {
    ...revDefaultGridSettings,
    ...revReadonlyBehavioredSettings,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    merge: () => false,
    clone: () => { return revReadonlyDefaultBehavioredGridSettings; }
} as const;
