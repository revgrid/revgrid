import { defaultColumnSettings } from '../../../settings-implementations/settings-implementations-public-api';
import { StandardColumnSettings } from '../../settings/standard-settings-public-api';
import { defaultStandardOnlyColumnSettings } from './default-standard-only-column-settings';

/** @public */
export const defaultStandardColumnSettings: StandardColumnSettings = {
    ...defaultColumnSettings,
    ...defaultStandardOnlyColumnSettings,
} as const;
