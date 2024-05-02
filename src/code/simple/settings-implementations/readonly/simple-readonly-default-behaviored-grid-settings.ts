import { revReadonlyBehavioredSettings } from '../../../settings-implementations/readonly/internal-api';
import { RevSimpleBehavioredGridSettings } from '../../settings/internal-api';
import { revSimpleDefaultGridSettings } from '../default/internal-api';

/** @public */
export const revSimpleReadonlyDefaultBehavioredGridSettings: Readonly<RevSimpleBehavioredGridSettings> = {
    ...revSimpleDefaultGridSettings,
    ...revReadonlyBehavioredSettings,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    merge: () => false,
    clone: () => { return revSimpleReadonlyDefaultBehavioredGridSettings; }
} as const;
