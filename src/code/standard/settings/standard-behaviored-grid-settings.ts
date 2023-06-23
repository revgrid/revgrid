import { TextBehavioredGridSettings } from '../../text/text-public-api';
import { StandardGridSettings } from './standard-grid-settings';

/** @public */
export interface StandardBehavioredGridSettings extends StandardGridSettings, TextBehavioredGridSettings {
    merge(settings: Partial<StandardGridSettings>): void;
    clone(): StandardBehavioredGridSettings;
}
