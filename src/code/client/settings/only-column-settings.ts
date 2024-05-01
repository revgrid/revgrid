// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevOnlyGridSettings } from './only-grid-settings';

/** @public */
export type RevOnlyColumnSettings = Pick<RevOnlyGridSettings,
    'backgroundColor' |
    'color' |
    'columnAutoSizingMax' |
    'columnClip' |
    'defaultColumnAutoSizing' |
    'defaultColumnWidth' |
    'editable' |
    'editOnClick' |
    'editOnDoubleClick' |
    'editOnFocusCell' |
    'editOnKeyDown' |
    'editorClickableCursorName' |
    'filterable' |
    'maximumColumnWidth' |
    'minimumColumnWidth' |
    'resizeColumnInPlace' |
    'sortOnDoubleClick' |
    'sortOnClick'
>
