import { TextOnlyGridSettings } from './text-only-grid-settings';

/** @public */
export type TextOnlyColumnSettings = Pick<TextOnlyGridSettings,
    'horizontalAlign' |
    'verticalOffset' |
    'textTruncateType' |
    'textStrikeThrough'
>;
