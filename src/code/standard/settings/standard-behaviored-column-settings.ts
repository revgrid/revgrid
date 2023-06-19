import { BehavioredColumnSettings } from '../../grid/grid-public-api';
import { StandardAllColumnSettings } from './standard-all-column-settings';

/** @public */
export interface StandardBehavioredColumnSettings extends StandardAllColumnSettings, BehavioredColumnSettings {
    load(settings: StandardAllColumnSettings): void;
    clone(): StandardBehavioredColumnSettings;
}

