import { RevBehavioredSettings } from './behaviored-settings';
import { RevGridSettings } from './grid-settings';

/** @public */
export interface RevBehavioredGridSettings extends RevGridSettings, RevBehavioredSettings {
    merge(settings: Partial<RevGridSettings>): boolean;
    clone(): RevBehavioredGridSettings;
}
