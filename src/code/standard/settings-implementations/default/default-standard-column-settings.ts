import { defaultTextColumnSettings } from '../../../text/text-public-api';
import { StandardColumnSettings } from '../../settings/standard-settings-public-api';
import { defaultStandardOnlyColumnSettings } from './default-standard-only-column-settings';

/** @public */
export const defaultStandardColumnSettings: StandardColumnSettings = {
    ...defaultTextColumnSettings,
    ...defaultStandardOnlyColumnSettings,
} as const;
