import { revReadonlyBehavioredSettings } from '../../../settings-implementations';
import { RevSimpleBehavioredColumnSettings } from '../../settings/internal-api';
import { revSimpleDefaultColumnSettings, revSimpleDefaultGridSettings } from '../default/internal-api';

/** @public */
export const revSimpleReadonlyDefaultBehavioredColumnSettings: Readonly<RevSimpleBehavioredColumnSettings> = {
    gridSettings: revSimpleDefaultGridSettings,
    ...revSimpleDefaultColumnSettings,
    ...revReadonlyBehavioredSettings,
    merge: () => false,
    clone: () => { return revSimpleReadonlyDefaultBehavioredColumnSettings; }
} as const;
