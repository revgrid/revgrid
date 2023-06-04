import { ColumnSettings } from '../../grid/grid-public-api';
import { defaultGridSettings } from './default-grid-settings';

/** @public */
export const defaultColumnSettings: Required<ColumnSettings> = {
    color: defaultGridSettings.color,
    backgroundColor: defaultGridSettings.backgroundColor,
    columnAutosizing: defaultGridSettings.columnAutosizing,
    columnAutosizingMax: defaultGridSettings.columnAutosizingMax,
    columnClip: defaultGridSettings.columnClip,
    defaultColumnWidth: defaultGridSettings.defaultColumnWidth,
    editable: defaultGridSettings.editable,
    editOnDoubleClick: defaultGridSettings.editOnDoubleClick,
    editOnKeydown: defaultGridSettings.editOnKeydown,
    editOnFocusCell: defaultGridSettings.editOnFocusCell,
    feedbackCount: defaultGridSettings.feedbackCount,
    filterable: defaultGridSettings.filterable,
    minimumColumnWidth: defaultGridSettings.minimumColumnWidth,
    maximumColumnWidth: defaultGridSettings.maximumColumnWidth,
    resizeColumnInPlace: defaultGridSettings.resizeColumnInPlace,
    mouseSortable: defaultGridSettings.mouseSortable,
    mouseSortOnDoubleClick: defaultGridSettings.mouseSortOnDoubleClick,
};
