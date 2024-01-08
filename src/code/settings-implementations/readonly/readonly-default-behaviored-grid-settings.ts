import { BehavioredGridSettings } from '../../grid/grid-public-api';
import { defaultGridSettings } from '../default/settings-implementations-default-public-api';
import { readonlyBehavioredSettings } from './readonly-behaviored-settings';

/** @public */
export const readonlyDefaultBehavioredGridSettings: Readonly<BehavioredGridSettings> = {
    ...defaultGridSettings,
    ...readonlyBehavioredSettings,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    merge: () => false,
    clone: () => { return readonlyDefaultBehavioredGridSettings; }
} as const;
