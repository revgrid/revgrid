import { defaultColumnSettings } from '../../../settings-implementations/internal-api';
import { StandardColumnSettings } from '../../settings/internal-api';
import { defaultStandardOnlyColumnSettings } from './default-standard-only-column-settings';

/** @public */
export const defaultStandardColumnSettings: StandardColumnSettings = {
    ...defaultColumnSettings,
    ...defaultStandardOnlyColumnSettings,
} as const;
