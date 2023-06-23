import { BehavioredColumnSettings } from '../../grid/grid-public-api';
import { TextColumnSettings } from './text-column-settings';

/** @public */
export interface TextBehavioredColumnSettings extends TextColumnSettings, BehavioredColumnSettings {
    merge(settings: Partial<TextColumnSettings>): void;
    clone(): TextBehavioredColumnSettings;
}

