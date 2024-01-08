import { readonlyBehavioredSettings } from '../../../settings-implementations/settings-implementations-public-api';
import { StandardBehavioredColumnSettings } from '../../settings/standard-settings-public-api';
import { defaultStandardColumnSettings, defaultStandardGridSettings } from '../default/standard-settings-implementations-default-public-api';

/** @public */
export const readonlyDefaultStandardBehavioredColumnSettings: Readonly<StandardBehavioredColumnSettings> = {
    gridSettings: defaultStandardGridSettings,
    ...defaultStandardColumnSettings,
    ...readonlyBehavioredSettings,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    merge: () => false,
    clone: () => { return readonlyDefaultStandardBehavioredColumnSettings; }
} as const;
