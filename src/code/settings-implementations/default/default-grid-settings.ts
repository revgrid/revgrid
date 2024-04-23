import { GridSettings } from '../../grid/internal-api';
import { defaultOnlyGridSettings } from './default-only-grid-settings';

/** @public */
export const defaultGridSettings: GridSettings = {
    ...defaultOnlyGridSettings,
} as const;
