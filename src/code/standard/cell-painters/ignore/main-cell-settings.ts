import { GridSettings, Halign, TextTruncateType } from '../../grid/grid-public-api';

/** @public */
export interface MainCellSettings {
    readonly columnName: string;

    readonly focusedCellBorderColor: string;
    readonly backgroundSelectionColor: string;
    readonly color: string;
    readonly foregroundSelectionColor: string;
    readonly foregroundSelectionFont: string;
    readonly cellHoverBackgroundColor: string | undefined;
    readonly columnHoverBackgroundColors: GridSettings.ColumnHoverBackgroundColors;
    readonly rowHoverBackgroundColor: string | undefined;
    readonly linkOnHover: boolean;
    readonly linkColor: string;
    readonly linkColorOnHover: boolean;
    readonly strikeThrough: boolean;
    readonly textTruncateType: TextTruncateType | undefined;
    readonly voffset: number;

    readonly cellPadding: number;
    readonly columnAutosizing: boolean;
    readonly font: string;
    readonly format: string | undefined;
    readonly gridLinesHWidth: number;
    readonly gridLinesVWidth: number;
    readonly link: false | string | GridSettings.LinkProp | GridSettings.LinkFunction;

    readonly backgroundColor: string;
    readonly halign: Halign;
}
