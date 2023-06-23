import { TextOnlyColumnSettings } from '../../settings/text-settings-public-api';
import { defaultTextOnlyGridSettings } from './default-text-only-grid-settings';

/** @public */
export const defaultTextOnlyColumnSettings: TextOnlyColumnSettings = {
    horizontalAlign: defaultTextOnlyGridSettings.horizontalAlign,
    verticalOffset: defaultTextOnlyGridSettings.verticalOffset,
    textTruncateType: defaultTextOnlyGridSettings.textTruncateType,
    textStrikeThrough: defaultTextOnlyGridSettings.textStrikeThrough,
} as const;
