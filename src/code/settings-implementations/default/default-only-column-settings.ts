import { OnlyColumnSettings } from '../../client/internal-api';
import { defaultOnlyGridSettings } from './default-only-grid-settings';

/** @public */
export const defaultOnlyColumnSettings: OnlyColumnSettings = {
    color: defaultOnlyGridSettings.color,
    backgroundColor: defaultOnlyGridSettings.backgroundColor,
    defaultColumnAutoSizing: defaultOnlyGridSettings.defaultColumnAutoSizing,
    columnAutoSizingMax: defaultOnlyGridSettings.columnAutoSizingMax,
    columnClip: defaultOnlyGridSettings.columnClip,
    defaultColumnWidth: defaultOnlyGridSettings.defaultColumnWidth,
    editable: defaultOnlyGridSettings.editable,
    editOnDoubleClick: defaultOnlyGridSettings.editOnDoubleClick,
    editOnFocusCell: defaultOnlyGridSettings.editOnFocusCell,
    editOnKeyDown: defaultOnlyGridSettings.editOnKeyDown,
    editOnClick: defaultOnlyGridSettings.editOnClick,
    editorClickableCursorName: defaultOnlyGridSettings.editorClickableCursorName,
    filterable: defaultOnlyGridSettings.filterable,
    minimumColumnWidth: defaultOnlyGridSettings.minimumColumnWidth,
    maximumColumnWidth: defaultOnlyGridSettings.maximumColumnWidth,
    resizeColumnInPlace: defaultOnlyGridSettings.resizeColumnInPlace,
    sortOnClick: defaultOnlyGridSettings.sortOnClick,
    sortOnDoubleClick: defaultOnlyGridSettings.sortOnDoubleClick,
} as const;
