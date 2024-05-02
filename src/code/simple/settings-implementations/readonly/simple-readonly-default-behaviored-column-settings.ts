import { revReadonlyBehavioredSettings } from '../../../settings-implementations/internal-api';
import { RevSimpleBehavioredColumnSettings } from '../../settings/internal-api';
import { revSimpleDefaultColumnSettings, revSimpleDefaultGridSettings } from '../default/internal-api';

/** @public */
export const revSimpleReadonlyDefaultBehavioredColumnSettings: Readonly<RevSimpleBehavioredColumnSettings> = {
    gridSettings: revSimpleDefaultGridSettings,
    ...revSimpleDefaultColumnSettings,
    ...revReadonlyBehavioredSettings,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    merge: () => false,
    clone: () => { return revSimpleReadonlyDefaultBehavioredColumnSettings; }
} as const;
