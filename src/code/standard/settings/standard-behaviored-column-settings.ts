import { TextBehavioredColumnSettings } from '../../text/text-public-api';
import { StandardColumnSettings } from './standard-column-settings';

/** @public */
export interface StandardBehavioredColumnSettings extends StandardColumnSettings, TextBehavioredColumnSettings {
    merge(settings: Partial<StandardColumnSettings>): void;
    clone(): StandardBehavioredColumnSettings;
}

