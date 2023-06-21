import { BehavioredColumnSettings } from '../../grid/grid-public-api';
import { StandardAllColumnSettings } from './standard-all-column-settings';

/** @public */
export interface StandardBehavioredColumnSettings extends StandardAllColumnSettings, BehavioredColumnSettings {
    merge(settings: Partial<StandardAllColumnSettings>): void;
    clone(): StandardBehavioredColumnSettings;
}

