import { RevBehavioredSettings } from './behaviored-settings';
import { RevColumnSettings } from './column-settings';
import { RevGridSettings } from './grid-settings';

/** @public */
export interface RevBehavioredColumnSettings extends RevColumnSettings, RevBehavioredSettings {
    readonly gridSettings: RevGridSettings;

    merge(settings: Partial<RevColumnSettings>, overrideGrid: boolean): boolean;
    clone(overrideGrid: boolean): RevBehavioredColumnSettings;
}
