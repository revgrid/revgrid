import { StandardOnlyGridSettings } from './standard-only-grid-settings';

/** @public */
export type StandardOnlyColumnSettings = Pick<StandardOnlyGridSettings,
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
