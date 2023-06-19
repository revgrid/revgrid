import { BehavioredColumnSettings } from '../../grid/grid-public-api';
import { defaultColumnSettings, defaultGridSettings } from '../default/settings-implementations-default-public-api';
import { readonlyBehavioredSettings } from './readonly-behaviored-settings';

/** @public */
export const readonlyDefaultBehavioredColumnSettings: BehavioredColumnSettings = {
    gridSettings: defaultGridSettings,
    ...defaultColumnSettings,
    ...readonlyBehavioredSettings,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    load: () => {},
    clone: () => { return readonlyDefaultBehavioredColumnSettings; }
}
