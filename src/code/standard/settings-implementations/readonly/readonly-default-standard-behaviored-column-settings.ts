import { readonlyBehavioredSettings } from '../../../settings-implementations/internal-api';
import { StandardBehavioredColumnSettings } from '../../settings/internal-api';
import { defaultStandardColumnSettings, defaultStandardGridSettings } from '../default/internal-api';

/** @public */
export const readonlyDefaultStandardBehavioredColumnSettings: Readonly<StandardBehavioredColumnSettings> = {
    gridSettings: defaultStandardGridSettings,
    ...defaultStandardColumnSettings,
    ...readonlyBehavioredSettings,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    merge: () => false,
    clone: () => { return readonlyDefaultStandardBehavioredColumnSettings; }
} as const;
