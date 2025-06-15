import { RevOnlyColumnSettings } from '../../client';
import { revDefaultOnlyGridSettings } from './default-only-grid-settings';

/** @public */
export const revDefaultOnlyColumnSettings: RevOnlyColumnSettings = {
    color: revDefaultOnlyGridSettings.color,
    backgroundColor: revDefaultOnlyGridSettings.backgroundColor,
    defaultColumnAutoSizing: revDefaultOnlyGridSettings.defaultColumnAutoSizing,
    columnAutoSizingMax: revDefaultOnlyGridSettings.columnAutoSizingMax,
    columnClip: revDefaultOnlyGridSettings.columnClip,
    defaultColumnWidth: revDefaultOnlyGridSettings.defaultColumnWidth,
    editable: revDefaultOnlyGridSettings.editable,
    editOnDoubleClick: revDefaultOnlyGridSettings.editOnDoubleClick,
    editOnFocusCell: revDefaultOnlyGridSettings.editOnFocusCell,
    editOnKeyDown: revDefaultOnlyGridSettings.editOnKeyDown,
    editOnClick: revDefaultOnlyGridSettings.editOnClick,
    editorClickableCursorName: revDefaultOnlyGridSettings.editorClickableCursorName,
    filterable: revDefaultOnlyGridSettings.filterable,
    minimumColumnWidth: revDefaultOnlyGridSettings.minimumColumnWidth,
    maximumColumnWidth: revDefaultOnlyGridSettings.maximumColumnWidth,
    resizeColumnInPlace: revDefaultOnlyGridSettings.resizeColumnInPlace,
    sortOnClick: revDefaultOnlyGridSettings.sortOnClick,
    sortOnDoubleClick: revDefaultOnlyGridSettings.sortOnDoubleClick,
} as const;
