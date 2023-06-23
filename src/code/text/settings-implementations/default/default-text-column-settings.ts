import { defaultColumnSettings } from '../../../settings-implementations/settings-implementations-public-api';
import { TextColumnSettings } from '../../settings/text-settings-public-api';
import { defaultTextOnlyColumnSettings } from './default-text-only-column-settings';

/** @public */
export const defaultTextColumnSettings: TextColumnSettings = {
    ...defaultColumnSettings,
    ...defaultTextOnlyColumnSettings,
} as const;
