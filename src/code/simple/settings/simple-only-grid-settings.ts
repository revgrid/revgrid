import { RevHorizontalAlign, RevHorizontalAlignId, RevTextTruncateType, RevTextTruncateTypeId } from '../../cell-content/client/internal-api';
import { RevGridSettings } from '../../client';
import { RevStandardTextPainter } from '../../standard/painters/internal-api';

/** @public */
export interface RevSimpleOnlyGridSettings extends RevStandardTextPainter.OnlyColumnSettings {
    /** Padding to left and right of cell content */
    cellPadding: number;
    cellFocusedBorderColor: RevGridSettings.Color | undefined;
    cellHoverBackgroundColor: RevGridSettings.Color | undefined;

    columnHoverBackgroundColor: RevGridSettings.Color | undefined;

    columnHeaderFont: string | undefined;
    readonly columnHeaderHorizontalAlignId: RevHorizontalAlignId;
    columnHeaderHorizontalAlign: RevHorizontalAlign;
    columnHeaderBackgroundColor: RevGridSettings.Color | undefined;
    columnHeaderForegroundColor: RevGridSettings.Color | undefined;
    /** Font style for selected columns' headers. */
    columnHeaderSelectionFont: string | undefined;
    columnHeaderSelectionBackgroundColor: RevGridSettings.Color | undefined;
    columnHeaderSelectionForegroundColor: RevGridSettings.Color | undefined;

    rowHoverBackgroundColor: RevGridSettings.Color | undefined;

    /** Font style for selected cell(s). */
    selectionFont: RevGridSettings.Color | undefined;
    /** Background color for selected cell(s). */
    selectionBackgroundColor: RevGridSettings.Color | undefined;
    /** Font color for selected cell(s). */
    selectionForegroundColor: RevGridSettings.Color | undefined;

    font: string;
    /** Horizontal alignment of content of each cell. */
    readonly horizontalAlignId: RevHorizontalAlignId;
    horizontalAlign: RevHorizontalAlign;
    /** Vertical offset from top of cell of content of each cell. */
    verticalOffset: number;
    readonly textTruncateTypeId: RevTextTruncateTypeId | undefined;
    textTruncateType: RevTextTruncateType | undefined;
    /** Display cell font with strike-through line drawn over it. */
    textStrikeThrough: boolean;
}
