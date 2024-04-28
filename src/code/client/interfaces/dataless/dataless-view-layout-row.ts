import { RevDatalessSubgrid } from './dataless-subgrid';

/** @public */
export interface RevDatalessViewLayoutRow {
    /** A back reference to the element's array index in {@link ViewLayout#rows}. */
    index: number;
    /** Local vertical row coordinate within the subgrid to which the row belongs. */
    subgridRowIndex: number;
    subgrid: RevDatalessSubgrid;
    /** Pixel coordinate of the top edge of this row, rounded to nearest integer. */
    top: number;
    /** Pixel coordinate of the bottom edge of this row, rounded to nearest integer. */
    bottomPlus1: number;
    /** Height of this row in pixels, rounded to nearest integer. */
    height: number;
}
