import { GridSettings } from '../../grid/internal-api';
import { HorizontalAlign, TextTruncateType } from '../painters/internal-api';

/** @public */
export interface StandardOnlyGridSettings {
    /** Padding to left and right of cell content */
    cellPadding: number;
    cellFocusedBorderColor: GridSettings.Color | undefined;
    cellHoverBackgroundColor: GridSettings.Color | undefined;

    columnHoverBackgroundColor: GridSettings.Color | undefined;

    columnHeaderFont: string | undefined;
    columnHeaderHorizontalAlign: HorizontalAlign | undefined;
    columnHeaderBackgroundColor: GridSettings.Color | undefined;
    columnHeaderForegroundColor: GridSettings.Color | undefined;
    /** Font style for selected columns' headers. */
    columnHeaderSelectionFont: string | undefined;
    columnHeaderSelectionBackgroundColor: GridSettings.Color | undefined;
    columnHeaderSelectionForegroundColor: GridSettings.Color | undefined;

    rowHoverBackgroundColor: GridSettings.Color | undefined;

    /** Font style for selected cell(s). */
    selectionFont: GridSettings.Color | undefined;
    /** Background color for selected cell(s). */
    selectionBackgroundColor: GridSettings.Color | undefined;
    /** Font color for selected cell(s). */
    selectionForegroundColor: GridSettings.Color | undefined;

    font: string;
    /** Horizontal alignment of content of each cell. */
    horizontalAlign: HorizontalAlign;
    /** Vertical offset from top of cell of content of each cell. */
    verticalOffset: number;
    textTruncateType: TextTruncateType | undefined;
    /** Display cell font with strike-through line drawn over it. */
    textStrikeThrough: boolean;
}
