import { ColumnSettings } from '../../grid/internal-api';
import { defaultOnlyColumnSettings } from './default-only-column-settings';

/** @public */
export const defaultColumnSettings: ColumnSettings = {
    ...defaultOnlyColumnSettings,
} as const;
