import { TextOnlyGridSettings, TextTruncateType } from '../../settings/text-settings-public-api';

/** @public */
export const defaultTextOnlyGridSettings: TextOnlyGridSettings = {
    horizontalAlign: 'center',
    verticalOffset: 0,
    textTruncateType: TextTruncateType.WithEllipsis,
    textStrikeThrough: false,
} as const;
