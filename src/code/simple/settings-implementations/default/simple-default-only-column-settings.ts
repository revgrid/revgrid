import { RevSimpleOnlyColumnSettings } from '../../settings';
import { revSimpleDefaultOnlyGridSettings } from './simple-default-only-grid-settings';

/** @public */
export const revSimpleDefaultOnlyColumnSettings: RevSimpleOnlyColumnSettings = {
    cellPadding: revSimpleDefaultOnlyGridSettings.cellPadding,
    cellFocusedBorderColor: revSimpleDefaultOnlyGridSettings.cellFocusedBorderColor,
    cellHoverBackgroundColor: revSimpleDefaultOnlyGridSettings.cellHoverBackgroundColor,
    columnHoverBackgroundColor: revSimpleDefaultOnlyGridSettings.columnHoverBackgroundColor,
    columnHeaderFont: revSimpleDefaultOnlyGridSettings.columnHeaderFont,
    columnHeaderHorizontalAlignId: revSimpleDefaultOnlyGridSettings.columnHeaderHorizontalAlignId,
    columnHeaderHorizontalAlign: revSimpleDefaultOnlyGridSettings.columnHeaderHorizontalAlign,
    columnHeaderBackgroundColor: revSimpleDefaultOnlyGridSettings.columnHeaderBackgroundColor,
    columnHeaderForegroundColor: revSimpleDefaultOnlyGridSettings.columnHeaderForegroundColor,
    columnHeaderSelectionFont: revSimpleDefaultOnlyGridSettings.columnHeaderSelectionFont,
    columnHeaderSelectionBackgroundColor: revSimpleDefaultOnlyGridSettings.columnHeaderSelectionBackgroundColor,
    columnHeaderSelectionForegroundColor: revSimpleDefaultOnlyGridSettings.columnHeaderSelectionForegroundColor,
    font: revSimpleDefaultOnlyGridSettings.font,
    horizontalAlignId: revSimpleDefaultOnlyGridSettings.horizontalAlignId,
    horizontalAlign: revSimpleDefaultOnlyGridSettings.horizontalAlign,
    verticalOffset: revSimpleDefaultOnlyGridSettings.verticalOffset,
    textTruncateTypeId: revSimpleDefaultOnlyGridSettings.textTruncateTypeId,
    textTruncateType: revSimpleDefaultOnlyGridSettings.textTruncateType,
    textStrikeThrough: revSimpleDefaultOnlyGridSettings.textStrikeThrough,
} as const;
