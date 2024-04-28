import { RevBehavioredGridSettings } from '../../client/internal-api';
import { RevStandardGridSettings } from './standard-grid-settings';

/** @public */
export interface RevStandardBehavioredGridSettings extends RevStandardGridSettings, RevBehavioredGridSettings {
    merge(settings: Partial<RevStandardGridSettings>): boolean;
    clone(): RevStandardBehavioredGridSettings;
}
