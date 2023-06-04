import { MergableGridSettings } from '../../grid/grid-public-api';
import { defaultGridSettings } from '../default/settings-implementations-default-public-api';
import { discardGridSettingsMerge } from './discard-grid-settings-merge';

/** @public */
export const discardDefaultMergableGridSettings: MergableGridSettings = {
    ...defaultGridSettings,
    ...discardGridSettingsMerge,
}
