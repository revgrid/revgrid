import { BehavioredSettings } from './behaviored-settings';
import { GridSettings } from './grid-settings';

/** @public */
export interface BehavioredGridSettings extends GridSettings, BehavioredSettings {
    merge(settings: Partial<GridSettings>): boolean;
    clone(): BehavioredGridSettings;
}
