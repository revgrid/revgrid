import { readonlyBehavioredSettings } from '../../../settings-implementations/readonly/settings-implementations-readonly-public-api';
import { StandardBehavioredGridSettings } from '../../settings/standard-settings-public-api';
import { defaultStandardAllGridSettings } from '../default/standard-settings-implementations-default-public-api';

/** @public */
export const readonlyDefaultStandardBehavioredGridSettings: Readonly<StandardBehavioredGridSettings> = {
    ...defaultStandardAllGridSettings,
    ...readonlyBehavioredSettings,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    load: () => {},
    clone: () => { return readonlyDefaultStandardBehavioredGridSettings; }
} as const;
