import { readonlyBehavioredSettings } from '../../../settings-implementations/settings-implementations-public-api';
import { StandardBehavioredColumnSettings } from '../../settings/standard-settings-public-api';
import { defaultStandardAllColumnSettings, defaultStandardAllGridSettings } from '../default/standard-settings-implementations-default-public-api';

/** @public */
export const readonlyDefaultStandardBehavioredColumnSettings: Readonly<StandardBehavioredColumnSettings> = {
    gridSettings: defaultStandardAllGridSettings,
    ...defaultStandardAllColumnSettings,
    ...readonlyBehavioredSettings,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    load: () => {},
    clone: () => { return readonlyDefaultStandardBehavioredColumnSettings; }
} as const;
