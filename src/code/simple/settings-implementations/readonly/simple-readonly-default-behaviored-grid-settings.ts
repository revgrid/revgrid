import { revReadonlyBehavioredSettings } from '../../../settings-implementations/readonly';
import { RevSimpleBehavioredGridSettings } from '../../settings';
import { revSimpleDefaultGridSettings } from '../default';

/** @public */
export const revSimpleReadonlyDefaultBehavioredGridSettings: Readonly<RevSimpleBehavioredGridSettings> = {
    ...revSimpleDefaultGridSettings,
    ...revReadonlyBehavioredSettings,
    merge: () => false,
    clone: () => { return revSimpleReadonlyDefaultBehavioredGridSettings; }
} as const;
