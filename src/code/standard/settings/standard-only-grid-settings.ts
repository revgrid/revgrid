import { GridSettings } from '../../grid/grid-public-api';
import { HorizontalAlign, TextTruncateType } from '../painters/standard-painters-public-api';

/** @public */
export interface StandardOnlyGridSettings {
    /** Padding to left and right of cell content */
    cellPadding: number;
    cellFocusedBorderColor: GridSettings.Color | undefined;
    cellHoverBackgroundColor: GridSettings.Color | undefined;

    columnHoverBackgroundColor: GridSettings.Color | undefined;

    columnHeaderFont: string;
    columnHeaderHorizontalAlign: HorizontalAlign;
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

    font: string;
    /** Horizontal alignment of content of each cell. */
    horizontalAlign: HorizontalAlign;
    /** Vertical offset from top of cell of content of each cell. */
    verticalOffset: number;
    textTruncateType: TextTruncateType | undefined;
    /** Display cell font with strike-through line drawn over it. */
    textStrikeThrough: boolean;
    /** Cursor to display when editor can be clicked */
    editorClickCursorName: string | undefined;
}
