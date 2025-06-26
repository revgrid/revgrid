import { revReadonlyBehavioredSettings } from '../../../settings-implementations';
import { RevSimpleBehavioredColumnSettings } from '../../settings';
import { revSimpleDefaultColumnSettings, revSimpleDefaultGridSettings } from '../default';

/** @public */
export const revSimpleReadonlyDefaultBehavioredColumnSettings: Readonly<RevSimpleBehavioredColumnSettings> = {
    gridSettings: revSimpleDefaultGridSettings,
    ...revSimpleDefaultColumnSettings,
    ...revReadonlyBehavioredSettings,
    merge: () => false,
    clone: () => { return revSimpleReadonlyDefaultBehavioredColumnSettings; }
} as const;
