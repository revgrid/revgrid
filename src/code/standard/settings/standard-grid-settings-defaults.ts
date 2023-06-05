import { TextTruncateType } from '../../grid/grid-public-api';
import { StandardGridSettings } from './standard-grid-settings';

/** @public */
export const standardGridSettingsDefaults: StandardGridSettings = {
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

    horizontalAlign: 'center',
    verticalOffset: 0,

    font: '13px Tahoma, Geneva, sans-serif',
    textTruncateType: TextTruncateType.WithEllipsis,
    textStrikeThrough: false,
}
