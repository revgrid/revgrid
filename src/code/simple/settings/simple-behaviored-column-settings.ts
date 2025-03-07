import { RevBehavioredColumnSettings } from '../../client/internal-api';
import { RevSimpleColumnSettings } from './simple-column-settings';

/** @public */
export interface RevSimpleBehavioredColumnSettings extends RevSimpleColumnSettings, RevBehavioredColumnSettings {
    merge(settings: Partial<RevSimpleColumnSettings>): boolean;
    clone(): RevSimpleBehavioredColumnSettings;
}

