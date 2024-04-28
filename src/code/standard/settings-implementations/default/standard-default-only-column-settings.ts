import { RevStandardOnlyColumnSettings } from '../../settings/internal-api';
import { revStandardDefaultOnlyGridSettings } from './standard-default-only-grid-settings';

/** @public */
export const revStandardDefaultOnlyColumnSettings: RevStandardOnlyColumnSettings = {
    cellPadding: revStandardDefaultOnlyGridSettings.cellPadding,
    cellFocusedBorderColor: revStandardDefaultOnlyGridSettings.cellFocusedBorderColor,
    cellHoverBackgroundColor: revStandardDefaultOnlyGridSettings.cellHoverBackgroundColor,
    columnHoverBackgroundColor: revStandardDefaultOnlyGridSettings.columnHoverBackgroundColor,
    columnHeaderFont: revStandardDefaultOnlyGridSettings.columnHeaderFont,
    columnHeaderHorizontalAlign: revStandardDefaultOnlyGridSettings.columnHeaderHorizontalAlign,
    columnHeaderBackgroundColor: revStandardDefaultOnlyGridSettings.columnHeaderBackgroundColor,
    columnHeaderForegroundColor: revStandardDefaultOnlyGridSettings.columnHeaderForegroundColor,
    columnHeaderSelectionFont: revStandardDefaultOnlyGridSettings.columnHeaderSelectionFont,
    columnHeaderSelectionBackgroundColor: revStandardDefaultOnlyGridSettings.columnHeaderSelectionBackgroundColor,
    columnHeaderSelectionForegroundColor: revStandardDefaultOnlyGridSettings.columnHeaderSelectionForegroundColor,
    font: revStandardDefaultOnlyGridSettings.font,
    horizontalAlign: revStandardDefaultOnlyGridSettings.horizontalAlign,
    verticalOffset: revStandardDefaultOnlyGridSettings.verticalOffset,
    textTruncateType: revStandardDefaultOnlyGridSettings.textTruncateType,
    textStrikeThrough: revStandardDefaultOnlyGridSettings.textStrikeThrough,
} as const;
