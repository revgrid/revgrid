import { GridSettings } from '../../grid/grid-public-api';
import { defaultOnlyGridSettings } from './default-only-grid-settings';

/** @public */
export const defaultGridSettings: GridSettings = {
    ...defaultOnlyGridSettings,
} as const;
