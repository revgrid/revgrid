import { ColumnSettings } from '../../grid/grid-public-api';
import { defaultGridSettings } from './default-grid-settings';

/** @public */
export const defaultColumnSettings: ColumnSettings = {
    color: defaultGridSettings.color,
    backgroundColor: defaultGridSettings.backgroundColor,
    defaultColumnAutoSizing: defaultGridSettings.defaultColumnAutoSizing,
    columnAutoSizingMax: defaultGridSettings.columnAutoSizingMax,
    columnClip: defaultGridSettings.columnClip,
    defaultColumnWidth: defaultGridSettings.defaultColumnWidth,
    editable: defaultGridSettings.editable,
    editOnDoubleClick: defaultGridSettings.editOnDoubleClick,
    editOnFocusCell: defaultGridSettings.editOnFocusCell,
    editOnKeyDown: defaultGridSettings.editOnKeyDown,
    editOnClick: defaultGridSettings.editOnClick,
    filterable: defaultGridSettings.filterable,
    minimumColumnWidth: defaultGridSettings.minimumColumnWidth,
    maximumColumnWidth: defaultGridSettings.maximumColumnWidth,
    resizeColumnInPlace: defaultGridSettings.resizeColumnInPlace,
    sortOnClick: defaultGridSettings.sortOnClick,
    sortOnDoubleClick: defaultGridSettings.sortOnDoubleClick,
} as const;
