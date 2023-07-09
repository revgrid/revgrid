import { BehavioredSettings } from './behaviored-settings';
import { ColumnSettings } from './column-settings';
import { GridSettings } from './grid-settings';

/** @public */
export interface BehavioredColumnSettings extends ColumnSettings, BehavioredSettings {
    readonly gridSettings: GridSettings;

    merge(settings: Partial<ColumnSettings>): boolean;
    clone(): BehavioredColumnSettings;
}
