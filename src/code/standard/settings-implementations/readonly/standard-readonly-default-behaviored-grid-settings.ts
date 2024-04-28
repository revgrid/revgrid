import { revReadonlyBehavioredSettings } from '../../../settings-implementations/readonly/internal-api';
import { RevStandardBehavioredGridSettings } from '../../settings/internal-api';
import { revStandardDefaultGridSettings } from '../default/internal-api';

/** @public */
export const revStandardReadonlyDefaultBehavioredGridSettings: Readonly<RevStandardBehavioredGridSettings> = {
    ...revStandardDefaultGridSettings,
    ...revReadonlyBehavioredSettings,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    merge: () => false,
    clone: () => { return revStandardReadonlyDefaultBehavioredGridSettings; }
} as const;
