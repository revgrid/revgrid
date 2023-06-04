import { MergableColumnSettings } from '../../grid/grid-public-api';
import { defaultColumnSettings } from '../default/settings-implementations-default-public-api';
import { discardColumnSettingsMerge } from './discard-column-settings-merge';

/** @public */
export const discardDefaultMergableColumnSettings: MergableColumnSettings = {
    ...defaultColumnSettings,
    ...discardColumnSettingsMerge,
}
