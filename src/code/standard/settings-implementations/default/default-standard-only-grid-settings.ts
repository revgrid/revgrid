import { TextTruncateType } from '../../painters/standard-painters-public-api';
import { StandardOnlyGridSettings } from '../../settings/standard-settings-public-api';

/** @public */
export const defaultStandardOnlyGridSettings: StandardOnlyGridSettings = {
    cellPadding: 5,
    font: '13px Tahoma, Geneva, sans-serif',
    horizontalAlign: 'center',
    verticalOffset: 0,
    textTruncateType: TextTruncateType.WithEllipsis,
    textStrikeThrough: false,

    // When the following settings are undefined, typically a cell painter will fallback to another setting (if it supports that setting)
    cellFocusedBorderColor: undefined,
    cellHoverBackgroundColor: undefined,

    columnHoverBackgroundColor: undefined,

    columnHeaderFont: undefined,
    columnHeaderHorizontalAlign: undefined,
    columnHeaderBackgroundColor: undefined,
    columnHeaderForegroundColor: undefined,

    columnHeaderSelectionFont: undefined,
    columnHeaderSelectionForegroundColor: undefined,
    columnHeaderSelectionBackgroundColor: undefined,

    rowHoverBackgroundColor: undefined,

    selectionFont: undefined,
    selectionBackgroundColor: undefined,
    selectionForegroundColor: undefined,
} as const;
