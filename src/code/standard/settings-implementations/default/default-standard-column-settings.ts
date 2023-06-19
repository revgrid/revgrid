import { StandardColumnSettings } from '../../settings/standard-settings-public-api';
import { defaultStandardGridSettings } from './default-standard-grid-settings';

/** @public */
export const defaultStandardColumnSettings: StandardColumnSettings = {
    cellPadding: defaultStandardGridSettings.cellPadding,
    cellFocusedBorderColor: defaultStandardGridSettings.cellFocusedBorderColor,
    cellHoverBackgroundColor: defaultStandardGridSettings.cellHoverBackgroundColor,
    columnHoverBackgroundColor: defaultStandardGridSettings.columnHoverBackgroundColor,
    columnHeaderFont: defaultStandardGridSettings.columnHeaderFont,
    columnHeaderHorizontalAlign: defaultStandardGridSettings.columnHeaderHorizontalAlign,
    columnHeaderBackgroundColor: defaultStandardGridSettings.columnHeaderBackgroundColor,
    columnHeaderForegroundColor: defaultStandardGridSettings.columnHeaderForegroundColor,
    columnHeaderSelectionFont: defaultStandardGridSettings.columnHeaderSelectionFont,
    columnHeaderSelectionBackgroundColor: defaultStandardGridSettings.columnHeaderSelectionBackgroundColor,
    columnHeaderSelectionForegroundColor: defaultStandardGridSettings.columnHeaderSelectionForegroundColor,
    horizontalAlign: defaultStandardGridSettings.horizontalAlign,
    verticalOffset: defaultStandardGridSettings.verticalOffset,
    font: defaultStandardGridSettings.font,
    textTruncateType: defaultStandardGridSettings.textTruncateType,
    textStrikeThrough: defaultStandardGridSettings.textStrikeThrough,
    editorClickCursorName: defaultStandardGridSettings.editorClickCursorName,
}
