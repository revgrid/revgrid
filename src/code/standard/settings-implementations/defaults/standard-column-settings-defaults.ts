import { StandardColumnSettings } from '../../settings/standard-settings-public-api';
import { standardGridSettingsDefaults } from './standard-grid-settings-defaults';

/** @public */
export const standardColumnSettingsDefaults: Required<StandardColumnSettings> = {
    cellPadding: standardGridSettingsDefaults.cellPadding,
    cellFocusedBorderColor: standardGridSettingsDefaults.cellFocusedBorderColor,
    cellHoverBackgroundColor: standardGridSettingsDefaults.cellHoverBackgroundColor,
    columnHoverBackgroundColor: standardGridSettingsDefaults.columnHoverBackgroundColor,
    columnHeaderFont: standardGridSettingsDefaults.columnHeaderFont,
    columnHeaderHorizontalAlign: standardGridSettingsDefaults.columnHeaderHorizontalAlign,
    columnHeaderBackgroundColor: standardGridSettingsDefaults.columnHeaderBackgroundColor,
    columnHeaderForegroundColor: standardGridSettingsDefaults.columnHeaderForegroundColor,
    columnHeaderSelectionFont: standardGridSettingsDefaults.columnHeaderSelectionFont,
    columnHeaderSelectionBackgroundColor: standardGridSettingsDefaults.columnHeaderSelectionBackgroundColor,
    columnHeaderSelectionForegroundColor: standardGridSettingsDefaults.columnHeaderSelectionForegroundColor,
    horizontalAlign: standardGridSettingsDefaults.horizontalAlign,
    verticalOffset: standardGridSettingsDefaults.verticalOffset,
    font: standardGridSettingsDefaults.font,
    textTruncateType: standardGridSettingsDefaults.textTruncateType,
    textStrikeThrough: standardGridSettingsDefaults.textStrikeThrough,
    editorClickCursorName: standardGridSettingsDefaults.editorClickCursorName,
}
