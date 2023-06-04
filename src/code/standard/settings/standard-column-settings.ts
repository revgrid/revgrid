import { StandardGridSettings } from './standard-grid-settings';

export type StandardColumnSettings = Pick<StandardGridSettings,
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
    'horizontalAlign' |
    'verticalOffset' |
    'font' |
    'textTruncateType' |
    'textStrikeThrough'
>;
