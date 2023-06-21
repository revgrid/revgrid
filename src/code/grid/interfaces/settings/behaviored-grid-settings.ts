import { AllGridSettings } from './all-grid-settings';
import { BehavioredSettings } from './behaviored-settings';

/** @public */
export interface BehavioredGridSettings extends AllGridSettings, BehavioredSettings {
    merge(settings: Partial<AllGridSettings>): void;
    clone(): BehavioredGridSettings;
}
