import { readonlyBehavioredSettings } from '../../../settings-implementations/readonly/settings-implementations-readonly-public-api';
import { StandardBehavioredGridSettings } from '../../settings/standard-settings-public-api';
import { defaultStandardGridSettings } from '../default/standard-settings-implementations-default-public-api';

/** @public */
export const readonlyDefaultStandardBehavioredGridSettings: Readonly<StandardBehavioredGridSettings> = {
    ...defaultStandardGridSettings,
    ...readonlyBehavioredSettings,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    merge: () => false,
    clone: () => { return readonlyDefaultStandardBehavioredGridSettings; }
} as const;
