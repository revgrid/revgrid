import { RevBehavioredColumnSettings } from '../../client/internal-api';
import { RevStandardColumnSettings } from './standard-column-settings';

/** @public */
export interface RevStandardBehavioredColumnSettings extends RevStandardColumnSettings, RevBehavioredColumnSettings {
    merge(settings: Partial<RevStandardColumnSettings>): boolean;
    clone(): RevStandardBehavioredColumnSettings;
}

