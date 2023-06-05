import { BehavioredGridSettings } from '../../grid/grid-public-api';
import { defaultGridSettings } from '../default/settings-implementations-default-public-api';
import { discardGridSettingsBehavior } from './discard-grid-settings-behavior';

/** @public */
export const discardDefaultBehavioredGridSettings: BehavioredGridSettings = {
    ...defaultGridSettings,
    ...discardGridSettingsBehavior,
}
