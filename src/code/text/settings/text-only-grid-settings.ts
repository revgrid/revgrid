import { TextTruncateType } from './text-truncate-type';

/** @public */
export interface TextOnlyGridSettings {
    /** Vertical offset from top of cell of content of each cell. */
    verticalOffset: number;
    textTruncateType: TextTruncateType | undefined;
    /** Display cell font with strike-through line drawn over it. */
    textStrikeThrough: boolean;
}
