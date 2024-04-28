import { RevStandardOnlyGridSettings } from './standard-only-grid-settings';

/** @public */
export type RevStandardOnlyColumnSettings = Pick<RevStandardOnlyGridSettings,
    'cellPadding' |
    'cellFocusedBorderColor' |
    'cellHoverBackgroundColor' |
    'columnHoverBackgroundColor' |
    'columnHeaderFont' |
    'columnHeaderHorizontalAlign' |
    'columnHeaderBackgroundColor' |
    'columnHeaderForegroundColor' |
    'columnHeaderSelectionFont' |
    'columnHeaderSelectionBackgroundColor' |
    'columnHeaderSelectionForegroundColor' |
    'font' |
    'horizontalAlign' |
    'verticalOffset' |
    'textTruncateType' |
    'textStrikeThrough'
>;
