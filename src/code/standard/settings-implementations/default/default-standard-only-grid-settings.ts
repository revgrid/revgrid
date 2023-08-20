import { TextTruncateType } from '../../painters/standard-painters-public-api';
import { StandardOnlyGridSettings } from '../../settings/standard-settings-public-api';

/** @public */
export const defaultStandardOnlyGridSettings: StandardOnlyGridSettings = {
    cellPadding: 5,
    cellFocusedBorderColor: '#696969',
    cellHoverBackgroundColor: 'rgba(160, 160, 40, 0.45)',

    columnHoverBackgroundColor: 'rgba(100, 100, 25, 0.30)',

    columnHeaderFont: '12px Tahoma, Geneva, sans-serif',
    columnHeaderHorizontalAlign: 'center',
    columnHeaderBackgroundColor: 'rgb(223, 227, 232)',
    columnHeaderForegroundColor: 'rgb(25, 25, 25)',

    columnHeaderSelectionFont: 'bold 12px Tahoma, Geneva, sans-serif',
    columnHeaderSelectionForegroundColor: 'rgb(80, 80, 80)',
    columnHeaderSelectionBackgroundColor: 'rgba(255, 220, 97, 0.45)',

    rowHoverBackgroundColor: 'rgba(60, 60, 15, 0.15)',

    selectionFont: 'bold 13px Tahoma, Geneva, sans-serif',
    selectionBackgroundColor: 'rgba(147, 185, 255, 0.625)',
    selectionForegroundColor: 'rgb(0, 0, 128)',

    font: '13px Tahoma, Geneva, sans-serif',
    horizontalAlign: 'center',
    verticalOffset: 0,
    textTruncateType: TextTruncateType.WithEllipsis,
    textStrikeThrough: false,

    editorClickCursorName: 'pointer',
} as const;
