import { GridSettingsBehavior } from '../../grid/grid-public-api';
import { StandardAllGridSettings } from './standard-all-grid-settings';

/** @public */
export interface StandardGridSettingsBehavior extends GridSettingsBehavior {
    load(settings: StandardAllGridSettings): void;
}
