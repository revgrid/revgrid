import { RevBehavioredColumnSettings } from '../../client';
import { RevSimpleColumnSettings } from './simple-column-settings';

/** @public */
export interface RevSimpleBehavioredColumnSettings extends RevSimpleColumnSettings, RevBehavioredColumnSettings {
    merge(settings: Partial<RevSimpleColumnSettings>, overrideGrid: boolean): boolean;
    clone(overrideGrid: boolean): RevSimpleBehavioredColumnSettings;
}

