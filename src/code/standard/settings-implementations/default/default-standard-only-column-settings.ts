import { StandardOnlyColumnSettings } from '../../settings/standard-settings-public-api';
import { defaultStandardOnlyGridSettings } from './default-standard-only-grid-settings';

/** @public */
export const defaultStandardOnlyColumnSettings: StandardOnlyColumnSettings = {
    cellPadding: defaultStandardOnlyGridSettings.cellPadding,
    cellFocusedBorderColor: defaultStandardOnlyGridSettings.cellFocusedBorderColor,
    cellHoverBackgroundColor: defaultStandardOnlyGridSettings.cellHoverBackgroundColor,
    columnHoverBackgroundColor: defaultStandardOnlyGridSettings.columnHoverBackgroundColor,
    columnHeaderFont: defaultStandardOnlyGridSettings.columnHeaderFont,
    columnHeaderHorizontalAlign: defaultStandardOnlyGridSettings.columnHeaderHorizontalAlign,
    columnHeaderBackgroundColor: defaultStandardOnlyGridSettings.columnHeaderBackgroundColor,
    columnHeaderForegroundColor: defaultStandardOnlyGridSettings.columnHeaderForegroundColor,
    columnHeaderSelectionFont: defaultStandardOnlyGridSettings.columnHeaderSelectionFont,
    columnHeaderSelectionBackgroundColor: defaultStandardOnlyGridSettings.columnHeaderSelectionBackgroundColor,
    columnHeaderSelectionForegroundColor: defaultStandardOnlyGridSettings.columnHeaderSelectionForegroundColor,
    font: defaultStandardOnlyGridSettings.font,
    horizontalAlign: defaultStandardOnlyGridSettings.horizontalAlign,
    verticalOffset: defaultStandardOnlyGridSettings.verticalOffset,
    textTruncateType: defaultStandardOnlyGridSettings.textTruncateType,
    textStrikeThrough: defaultStandardOnlyGridSettings.textStrikeThrough,
} as const;
