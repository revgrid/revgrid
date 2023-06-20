import { defaultColumnSettings } from '../../../settings-implementations/settings-implementations-public-api';
import { StandardAllColumnSettings } from '../../settings/standard-settings-public-api';
import { defaultStandardColumnSettings } from './default-standard-column-settings';

/** @public */
export const defaultStandardAllColumnSettings: StandardAllColumnSettings = {
    ...defaultColumnSettings,
    ...defaultStandardColumnSettings,
} as const;
