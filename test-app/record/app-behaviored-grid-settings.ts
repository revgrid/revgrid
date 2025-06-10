import { RevBehavioredGridSettings } from '../..';
import { AppGridSettings } from './app-grid-settings';

/** @public */
export interface AppBehavioredGridSettings extends AppGridSettings, RevBehavioredGridSettings {
    merge(settings: Partial<AppGridSettings>): boolean;
    clone(): AppBehavioredGridSettings;
}
