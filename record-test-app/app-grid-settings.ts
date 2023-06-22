import { StandardGridSettings } from '../dist/types/public-api';
import { AppOnlyGridSettings } from './app-only-grid-settings';

/** @public */
export interface AppGridSettings extends AppOnlyGridSettings, StandardGridSettings {

}
