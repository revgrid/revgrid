import { revReadonlyBehavioredSettings } from '../../../settings-implementations/internal-api';
import { RevStandardBehavioredColumnSettings } from '../../settings/internal-api';
import { revStandardDefaultColumnSettings, revStandardDefaultGridSettings } from '../default/internal-api';

/** @public */
export const revStandardReadonlyDefaultBehavioredColumnSettings: Readonly<RevStandardBehavioredColumnSettings> = {
    gridSettings: revStandardDefaultGridSettings,
    ...revStandardDefaultColumnSettings,
    ...revReadonlyBehavioredSettings,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    merge: () => false,
    clone: () => { return revStandardReadonlyDefaultBehavioredColumnSettings; }
} as const;
