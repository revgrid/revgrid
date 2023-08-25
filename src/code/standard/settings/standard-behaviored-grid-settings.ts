import { BehavioredGridSettings } from '../../grid/grid-public-api';
import { StandardGridSettings } from './standard-grid-settings';

/** @public */
export interface StandardBehavioredGridSettings extends StandardGridSettings, BehavioredGridSettings {
    merge(settings: Partial<StandardGridSettings>): boolean;
    clone(): StandardBehavioredGridSettings;
}
