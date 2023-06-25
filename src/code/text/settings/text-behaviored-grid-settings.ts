import { BehavioredGridSettings } from '../../grid/grid-public-api';
import { TextGridSettings } from './text-grid-settings';

/** @public */
export interface TextBehavioredGridSettings extends TextGridSettings, BehavioredGridSettings {
    merge(settings: Partial<TextGridSettings>): boolean;
    clone(): TextBehavioredGridSettings;
}
