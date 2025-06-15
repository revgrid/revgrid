import { RevSimpleOnlyGridSettings } from './simple-only-grid-settings';

/** @public */
export type RevSimpleOnlyColumnSettings = Pick<RevSimpleOnlyGridSettings,
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
