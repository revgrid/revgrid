import { OnlyGridSettings } from './only-grid-settings';

/** @public */
export type OnlyColumnSettings = Pick<OnlyGridSettings,
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
