import { ColumnSettings } from '../../grid/grid-public-api';
import { gridSettingsDefaults } from './grid-settings-defaults';

/** @public */
export const columnSettingsDefaults: Required<ColumnSettings> = {
    color: gridSettingsDefaults.color,
    backgroundColor: gridSettingsDefaults.backgroundColor,
    defaultColumnAutosizing: gridSettingsDefaults.defaultColumnAutosizing,
    columnAutosizingMax: gridSettingsDefaults.columnAutosizingMax,
    columnClip: gridSettingsDefaults.columnClip,
    defaultColumnWidth: gridSettingsDefaults.defaultColumnWidth,
    editable: gridSettingsDefaults.editable,
    editOnDoubleClick: gridSettingsDefaults.editOnDoubleClick,
    editOnKeydown: gridSettingsDefaults.editOnKeydown,
    editOnFocusCell: gridSettingsDefaults.editOnFocusCell,
    filterable: gridSettingsDefaults.filterable,
    minimumColumnWidth: gridSettingsDefaults.minimumColumnWidth,
    maximumColumnWidth: gridSettingsDefaults.maximumColumnWidth,
    resizeColumnInPlace: gridSettingsDefaults.resizeColumnInPlace,
    mouseSortable: gridSettingsDefaults.mouseSortable,
    mouseSortOnDoubleClick: gridSettingsDefaults.mouseSortOnDoubleClick,
};
