import { BehavioredGridSettings } from '..';
import { AppAllGridSettings } from './app-all-grid-settings';

/** @public */
export interface AppBehavioredGridSettings extends AppAllGridSettings, BehavioredGridSettings {
    load(settings: AppAllGridSettings): void;
    clone(): AppBehavioredGridSettings;
}
