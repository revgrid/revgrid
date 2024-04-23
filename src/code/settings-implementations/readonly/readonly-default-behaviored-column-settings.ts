import { BehavioredColumnSettings } from '../../grid/internal-api';
import { defaultColumnSettings, defaultGridSettings } from '../default/internal-api';
import { readonlyBehavioredSettings } from './readonly-behaviored-settings';

/** @public */
export const readonlyDefaultBehavioredColumnSettings: Readonly<BehavioredColumnSettings> = {
    gridSettings: defaultGridSettings,
    ...defaultColumnSettings,
    ...readonlyBehavioredSettings,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    merge: () => false,
    clone: () => { return readonlyDefaultBehavioredColumnSettings; }
} as const;
