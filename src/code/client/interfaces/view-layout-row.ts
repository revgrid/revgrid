import { RevSchemaField } from '../../common/internal-api';
import { RevBehavioredColumnSettings } from '../settings/internal-api';
// eslint-disable-next-line import/no-cycle
import { RevSubgrid } from './subgrid';

/** @public */
export interface RevViewLayoutRow<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    /** A back reference to the element's array index in {@link RevViewLayout#rows}. */
    index: number;
    /** Local vertical row coordinate within the subgrid to which the row belongs. */
    subgridRowIndex: number;
    /** The subgrid to which the row belongs. */
    subgrid: RevSubgrid<BCS, SF>;
    /** Pixel coordinate of the top edge of this row, rounded to nearest integer. */
    top: number;
    /** Pixel coordinate of the bottom edge of this row, rounded to nearest integer. */
    bottomPlus1: number;
    /** Height of this row in pixels, rounded to nearest integer. */
    height: number;
}
