import { readonlyBehavioredSettings } from '../../../settings-implementations/readonly/internal-api';
import { StandardBehavioredGridSettings } from '../../settings/internal-api';
import { defaultStandardGridSettings } from '../default/internal-api';

/** @public */
export const readonlyDefaultStandardBehavioredGridSettings: Readonly<StandardBehavioredGridSettings> = {
    ...defaultStandardGridSettings,
    ...readonlyBehavioredSettings,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    merge: () => false,
    clone: () => { return readonlyDefaultStandardBehavioredGridSettings; }
} as const;
