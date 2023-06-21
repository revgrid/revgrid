import { BehavioredGridSettings } from '..';
import { AppAllGridSettings } from './app-all-grid-settings';

/** @public */
export interface AppBehavioredGridSettings extends AppAllGridSettings, BehavioredGridSettings {
    merge(settings: Partial<AppAllGridSettings>): void;
    clone(): AppBehavioredGridSettings;
}
