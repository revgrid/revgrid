import { GridSettings } from './grid-settings';

/** @public */
export type ColumnSettings = Pick<GridSettings,
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
    'filterable' |
    'maximumColumnWidth' |
    'minimumColumnWidth' |
    'resizeColumnInPlace' |
    'sortOnDoubleClick' |
    'sortOnClick'
>

// export interface ColumnSettings extends ColumnSettings.HeaderFilter, ColumnSettings.Header, ColumnSettings.Filter {
//     readonly gridSettings: GridSettings

//     readonly header: ColumnSettings.Header;
//     readonly filter: ColumnSettings.Filter;

//     // Grid overrides
//     backgroundColor: GridSettings.Color;
//     columnAutoSizingMax: number | undefined;
//     columnClip: boolean | undefined;
//     editOnKeydown: boolean;
//     editOnFocusCell: boolean;
//     editor: string | undefined;
//     feedbackCount: number;
//     editable: boolean;
//     editOnDoubleClick: boolean;
//     filterable: boolean;
//     font: string;
//     format: string | undefined;
//     gridLinesVWidth: number;
//     gridLinesHWidth: number;
//     halign: Halign;
//     link: false | string | GridSettings.LinkProp | GridSettings.LinkFunction;
//     linkTarget: string;
//     maximumColumnWidth: number | undefined;
//     minimumColumnWidth: number;
//     resizeColumnInPlace: boolean;
//     sortOnDoubleClick: boolean;
//     sortable: boolean;

//     // Grid passthroughs so can be used by header and filter
//     readonly color: string;
//     readonly backgroundSelectionColor: string;
//     readonly foregroundSelectionColor: string;
//     readonly foregroundSelectionFont: string;
//     readonly cellPainter: string;


//     columnAutoSizing: boolean;
//     width: number;
// }
/** @public */
// export namespace ColumnSettings {
//     export interface HeaderFilter {
//         backgroundColor: /* CanvasGradient | CanvasPattern | */ string;
//         backgroundSelectionColor: /* CanvasGradient | CanvasPattern | */ string;
//         color: /* CanvasGradient | CanvasPattern | */ string;
//         font: string;
//         foregroundSelectionColor: /* CanvasGradient | CanvasPattern | */ string;
//         halign: Halign;
//     }

//     export interface Header extends HeaderFilter {
//         format: string | undefined;
//         foregroundSelectionFont: string;
//         // autoSizing: boolean | undefined;
//         // autoSizingMax: number | undefined;
//     }

//     export interface Filter extends HeaderFilter {
//         editor: string | undefined;
//     }
// }
