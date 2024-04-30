import { RevStandardOnlyGridSettings } from './standard-only-grid-settings';

/** @public */
export type RevStandardOnlyColumnSettings = Pick<RevStandardOnlyGridSettings,
    'cellPadding' |
    'cellFocusedBorderColor' |
    'cellHoverBackgroundColor' |
    'columnHoverBackgroundColor' |
    'columnHeaderFont' |
    'columnHeaderHorizontalAlignId' |
    'columnHeaderHorizontalAlign' |
    'columnHeaderBackgroundColor' |
    'columnHeaderForegroundColor' |
    'columnHeaderSelectionFont' |
    'columnHeaderSelectionBackgroundColor' |
    'columnHeaderSelectionForegroundColor' |
    'font' |
    'horizontalAlignId' |
    'horizontalAlign' |
    'verticalOffset' |
    'textTruncateTypeId' |
    'textTruncateType' |
    'textStrikeThrough'
>;
