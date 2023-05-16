import { Halign } from '../lib/types';
import { GridSettings } from './grid-settings';

/** @public */
export interface ColumnSettings extends ColumnSettings.HeaderFilter, ColumnSettings.ColumnHeader, ColumnSettings.Filter {
    readonly columnHeader: ColumnSettings.ColumnHeader;
    readonly filterProperties: ColumnSettings.Filter;

    preferredWidth?: number;

    // Grid overrides
    cellPadding: number;
    mouseCellSelection: boolean;
    columnAutosizingMax: number;
    columnClip: boolean | undefined;
    editOnKeydown: boolean;
    editOnFocusCell: boolean;
    editor: string | undefined;
    feedbackCount: number;
    editable: boolean;
    editOnDoubleClick: boolean;
    filterable: boolean;
    font: string;
    format: string | undefined;
    gridLinesVWidth: number;
    gridLinesHWidth: number;
    halign: Halign;
    link: false | string | GridSettings.LinkProp | GridSettings.LinkFunction;
    linkTarget: string;
    maximumColumnWidth: number | undefined;
    resizeColumnInPlace: boolean;
    sortOnDoubleClick: boolean;
    sortable: boolean;

    // Grid passthroughs so can be used by header and filter
    readonly color: string;
    readonly backgroundSelectionColor: string;
    readonly foregroundSelectionColor: string;
    readonly foregroundSelectionFont: string;
    readonly cellPainter: string;


    // Grid overrides set by painters as well
    backgroundColor: GridSettings.Color;
    columnAutosized: boolean;
    columnAutosizing: boolean;
    minimumColumnWidth: number;
    width: number;
}

/** @public */
export namespace ColumnSettings {
    export interface HeaderFilter {
        backgroundColor: /* CanvasGradient | CanvasPattern | */ string;
        backgroundSelectionColor: /* CanvasGradient | CanvasPattern | */ string;
        cellPainter: string;
        color: /* CanvasGradient | CanvasPattern | */ string;
        font: string;
        foregroundSelectionColor: /* CanvasGradient | CanvasPattern | */ string;
        halign: Halign;
    }

    export interface ColumnHeader extends HeaderFilter {
        format: string | undefined;
        foregroundSelectionFont: string;
        // autosizing: boolean | undefined;
        // autosizingMax: number | undefined;
    }

    export interface Filter extends HeaderFilter {
        editor: string | undefined;
    }
}

export interface MergableColumnSettings extends ColumnSettings {
    merge(properties: Partial<ColumnSettings>): void;
}
