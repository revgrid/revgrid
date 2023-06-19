import { ColumnSettings } from '../../grid/grid-public-api';
import { gridSettingsDefaults } from './grid-settings-defaults';

/** @public */
export const columnSettingsDefaults: Required<ColumnSettings> = {
    color: gridSettingsDefaults.color,
    backgroundColor: gridSettingsDefaults.backgroundColor,
    defaultColumnAutoSizing: gridSettingsDefaults.defaultColumnAutoSizing,
    columnAutoSizingMax: gridSettingsDefaults.columnAutoSizingMax,
    columnClip: gridSettingsDefaults.columnClip,
    defaultColumnWidth: gridSettingsDefaults.defaultColumnWidth,
    editable: gridSettingsDefaults.editable,
    editOnDoubleClick: gridSettingsDefaults.editOnDoubleClick,
    editOnFocusCell: gridSettingsDefaults.editOnFocusCell,
    editOnKeyDown: gridSettingsDefaults.editOnKeyDown,
    editOnClick: gridSettingsDefaults.editOnClick,
    filterable: gridSettingsDefaults.filterable,
    minimumColumnWidth: gridSettingsDefaults.minimumColumnWidth,
    maximumColumnWidth: gridSettingsDefaults.maximumColumnWidth,
    resizeColumnInPlace: gridSettingsDefaults.resizeColumnInPlace,
    sortOnClick: gridSettingsDefaults.sortOnClick,
    sortOnDoubleClick: gridSettingsDefaults.sortOnDoubleClick,
};
