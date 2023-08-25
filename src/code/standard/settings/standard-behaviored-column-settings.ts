import { BehavioredColumnSettings } from '../../grid/grid-public-api';
import { StandardColumnSettings } from './standard-column-settings';

/** @public */
export interface StandardBehavioredColumnSettings extends StandardColumnSettings, BehavioredColumnSettings {
    merge(settings: Partial<StandardColumnSettings>): boolean;
    clone(): StandardBehavioredColumnSettings;
}

