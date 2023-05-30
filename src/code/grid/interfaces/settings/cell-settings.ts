import { Halign, TextTruncateType } from '../../types-utils/types';
import { GridSettings } from './grid-settings';

/** @public */
export interface CellSettings {
    readonly columnName: string;

    readonly focusedCellBorderColor: string;
    readonly backgroundSelectionColor: string;
    readonly color: string;
    readonly foregroundSelectionColor: string;
    readonly foregroundSelectionFont: string;
    readonly headerTextWrapping: boolean;
    readonly hoverCellHighlight: GridSettings.HoverColors;
    readonly hoverColumnHighlight: GridSettings.HoverColors;
    readonly hoverRowHighlight: GridSettings.HoverColors;
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
