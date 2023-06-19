import { BehavioredGridSettings } from '../../grid/grid-public-api';
import { StandardAllGridSettings } from './standard-all-grid-settings';

/** @public */
export interface StandardBehavioredGridSettings extends StandardAllGridSettings, BehavioredGridSettings {
    load(settings: StandardAllGridSettings): void;
    clone(): StandardBehavioredGridSettings;
}
