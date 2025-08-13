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
    'cellEditPossibleCursorName' |
    'filterable' |
    'maximumColumnWidth' |
    'minimumColumnWidth' |
    'resizeColumnInPlace' |
    'sortOnDoubleClick' |
    'sortOnClick'
>
