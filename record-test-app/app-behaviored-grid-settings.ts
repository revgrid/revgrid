import { BehavioredGridSettings } from '..';
import { AppGridSettings } from './app-grid-settings';

/** @public */
export interface AppBehavioredGridSettings extends AppGridSettings, BehavioredGridSettings {
    merge(settings: Partial<AppGridSettings>): boolean;
    clone(): AppBehavioredGridSettings;
}
