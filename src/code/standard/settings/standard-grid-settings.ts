import { GridSettings, Halign, TextTruncateType } from '../../grid/grid-public-api';

/** @public */
export interface StandardGridSettings {
    /** Padding to left and right of cell content */
    cellPadding: number;
    cellFocusedBorderColor: GridSettings.Color;
    cellHoverBackgroundColor: GridSettings.Color | undefined;

    columnHoverBackgroundColor: GridSettings.Color | undefined;

    columnHeaderFont: string;
    columnHeaderHorizontalAlign: Halign;
    columnHeaderBackgroundColor: GridSettings.Color;
    columnHeaderForegroundColor: GridSettings.Color;
    /** Font style for selected columns' headers. */
    columnHeaderSelectionFont: string;
    columnHeaderSelectionBackgroundColor: GridSettings.Color;
    columnHeaderSelectionForegroundColor: GridSettings.Color;

    rowHoverBackgroundColor: GridSettings.Color | undefined;

    /** Font style for selected cell(s). */
    selectionFont: GridSettings.Color;
    /** Background color for selected cell(s). */
    selectionBackgroundColor: GridSettings.Color;
    /** Font color for selected cell(s). */
    selectionForegroundColor: GridSettings.Color;

    /** Horizontal alignment of content of each cell. */
    horizontalAlign: Halign;
    /** Vertical offset from top of cell of content of each cell. */
    verticalOffset: number;

    font: string;
    textTruncateType: TextTruncateType | undefined;
    /** Display cell font with strike-through line drawn over it. */
    textStrikeThrough: boolean;
}
