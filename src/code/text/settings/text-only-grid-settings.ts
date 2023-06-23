import { HorizontalAlign } from './horizontal-align';
import { TextTruncateType } from './text-truncate-type';

/** @public */
export interface TextOnlyGridSettings {
    /** Horizontal alignment of content of each cell. */
    horizontalAlign: HorizontalAlign;
    /** Vertical offset from top of cell of content of each cell. */
    verticalOffset: number;
    textTruncateType: TextTruncateType | undefined;
    /** Display cell font with strike-through line drawn over it. */
    textStrikeThrough: boolean;
}
