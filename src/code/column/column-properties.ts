import { GridProperties } from '../grid/grid-properties';
import { SchemaModel } from '../model/schema-model';
import { Column } from './column';

/** @public */
export interface ColumnProperties {
    readonly name: string;
    /** typeof DataValue contained in Column */
    type: string;

    readonly gridProperties: GridProperties;

    readonly columnHeader: ColumnProperties.ColumnHeader;
    readonly filterProperties: ColumnProperties.Filter;

    calculator?: SchemaModel.Column.Calculator; // not sure about this
    preferredWidth: number;

    // Grid overrides
    cellPadding: number;
    columnAutosizingMax: number;
    columnClip: boolean | null;
    editOnKeydown: boolean;
    editOnNextCell: boolean;
    editor: string;
    feedbackCount: number;
    filterable: boolean;
    font: string;
    format: string;
    gridLinesVWidth: number;
    gridLinesHWidth: number;
    halign: GridProperties.Halign;
    link: false | string | GridProperties.LinkProp | GridProperties.LinkFunction;
    linkTarget: string;
    maximumColumnWidth: number;
    resizeColumnInPlace: boolean;
    sortOnDoubleClick: boolean;
    unsortable: boolean;

    // Grid overrides set by painters as well
    backgroundColor: GridProperties.Color;
    columnAutosized: boolean;
    columnAutosizing: boolean;
    minimumColumnWidth: number;
    width: number;

    merge(properties: Partial<ColumnProperties>): void;
}

/** @public */
export namespace ColumnProperties {
    export type Constructor = new (gridProperties: GridProperties, column: Column) => ColumnProperties;

    export interface HeaderFilter {
        font: string | undefined;
        color: CanvasGradient | CanvasPattern | string | undefined;
        backgroundColor: CanvasGradient | CanvasPattern | string | undefined;
        foregroundSelectionColor: CanvasGradient | CanvasPattern | string | undefined;
        backgroundSelectionColor: CanvasGradient | CanvasPattern | string | undefined;
    }

    export interface ColumnHeader extends HeaderFilter {
        foregroundSelectionFont: string | undefined;
        halign: GridProperties.Halign | undefined;
        format: string | undefined;
        renderer: string | undefined;
        autosizing: boolean | undefined;
        autosizingMax: number | undefined;
        // leftIcon: { writable: true, value: undefined},
        // centerIcon: { writable: true, value: undefined},
        // rightIcon: { writable: true, value: undefined},
    }

    export interface Filter extends HeaderFilter {
        halign: GridProperties.Halign;
        renderer: string;
        editor: string;
        rightIcon: string; // key to images
    }
}
