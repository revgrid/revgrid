// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevBehavioredGridSettings } from '../../client/internal-api';
import { RevSimpleGridSettings } from './simple-grid-settings';

/** @public */
export interface RevSimpleBehavioredGridSettings extends RevSimpleGridSettings, RevBehavioredGridSettings {
    merge(settings: Partial<RevSimpleGridSettings>): boolean;
    clone(): RevSimpleBehavioredGridSettings;
}
