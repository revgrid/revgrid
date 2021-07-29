import { HypergridProperties } from '../grid/hypergrid-properties';
import { DataModel } from '../lib/data-model';

export interface ColumnProperties {
    type: string; // this is weird

    readonly rowHeader: ColumnProperties.RowHeader;
    readonly treeHeader: ColumnProperties.TreeHeader;
    readonly columnHeader: ColumnProperties.ColumnHeader;
    readonly filterProperties: ColumnProperties.Filter;

    calculator?: DataModel.ColumnSchema.Calculator; // not sure about this
    preferredWidth?: number;

    // Grid overrides
    boxSizing?: string;
    cellPadding?: number;
    columnAutosizingMax?: number;
    columnClip?: boolean | null;
    editOnKeydown?: boolean;
    editOnNextCell?: boolean;
    editor?: string;
    feedbackCount?: number;
    filterable?: boolean;
    font?: string;
    format?: string;
    gridLinesVWidth?: number;
    gridLinesHWidth?: number;
    halign?: HypergridProperties.Halign;
    link?: false | string | HypergridProperties.LinkProp | HypergridProperties.LinkFunction;
    linkTarget?: string;
    maximumColumnWidth?: number;
    resizeColumnInPlace?: boolean;
    sortOnDoubleClick?: boolean;
    unsortable?: boolean;

    // Grid overrides set by painters as well
    backgroundColor?: HypergridProperties.Color;
    columnAutosized?: boolean;
    columnAutosizing?: boolean;
    minimumColumnWidth?: number;
    width?: number;
}

export namespace ColumnProperties {
    export interface HeaderFilter {
        font: string | undefined;
        color: CanvasGradient | CanvasPattern | string | undefined;
        backgroundColor: CanvasGradient | CanvasPattern | string | undefined;
        foregroundSelectionColor: CanvasGradient | CanvasPattern | string | undefined;
        backgroundSelectionColor: CanvasGradient | CanvasPattern | string | undefined;
    }

    export interface RowHeader extends HeaderFilter {
        foregroundSelectionFont: string | undefined;
        leftIcon?: string | undefined; // key to image
        columnAutosizing: boolean | undefined;
    }

    // Tree Header probably no longer supported
    export interface TreeHeader extends HeaderFilter {
        foregroundSelectionFont: string | undefined;
        // renderer: string;
        // columnAutosizing: boolean;
        // columnAutosizingMax: number;
        //leftIcon: undefined
    }

    export interface ColumnHeader extends HeaderFilter {
        foregroundSelectionFont: string | undefined;
        halign: HypergridProperties.Halign | undefined;
        format: string | undefined;
        renderer: string | undefined;
        autosizing: boolean | undefined;
        autosizingMax: number | undefined;
        // leftIcon: { writable: true, value: undefined},
        // centerIcon: { writable: true, value: undefined},
        // rightIcon: { writable: true, value: undefined},
    }

    export interface Filter extends HeaderFilter {
        halign: HypergridProperties.Halign;
        renderer: string;
        editor: string;
        rightIcon: string; // key to images
    }
}
