import { BehavioredColumnSettings } from '../../grid/grid-public-api';
import { defaultColumnSettings } from '../default/settings-implementations-default-public-api';
import { discardColumnSettingsBehavior } from './discard-column-settings-behavior';

/** @public */
export const discardDefaultBehavioredColumnSettings: BehavioredColumnSettings = {
    ...defaultColumnSettings,
    ...discardColumnSettingsBehavior,
}
