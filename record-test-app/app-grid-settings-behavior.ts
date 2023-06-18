import { StandardGridSettingsBehavior } from '..';
import { AppAllGridSettings } from './app-all-grid-settings';

/** @public */
export interface AppGridSettingsBehavior extends StandardGridSettingsBehavior {
    load(settings: AppAllGridSettings): void;
}
