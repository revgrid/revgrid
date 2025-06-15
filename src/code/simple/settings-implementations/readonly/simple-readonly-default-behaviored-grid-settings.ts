import { revReadonlyBehavioredSettings } from '../../../settings-implementations/readonly/internal-api';
import { RevSimpleBehavioredGridSettings } from '../../settings/internal-api';
import { revSimpleDefaultGridSettings } from '../default/internal-api';

/** @public */
export const revSimpleReadonlyDefaultBehavioredGridSettings: Readonly<RevSimpleBehavioredGridSettings> = {
    ...revSimpleDefaultGridSettings,
    ...revReadonlyBehavioredSettings,
    merge: () => false,
    clone: () => { return revSimpleReadonlyDefaultBehavioredGridSettings; }
} as const;
