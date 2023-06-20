import { AllColumnSettings } from './all-column-settings';
import { AllGridSettings } from './all-grid-settings';
import { BehavioredSettings } from './behaviored-settings';

/** @public */
export interface BehavioredColumnSettings extends AllColumnSettings, BehavioredSettings{
    readonly gridSettings: AllGridSettings;

    load(settings: AllColumnSettings): void;
    clone(): BehavioredColumnSettings;
}
