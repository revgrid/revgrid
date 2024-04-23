import { SchemaField } from '../schema/schema-field';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { Column } from './column';

/** @public */
export interface ViewLayoutColumn<BCS extends BehavioredColumnSettings, SF extends SchemaField> {
    /** A back reference to the element's array index in {@link ViewLayout#columns}. */
    index: number;
    /** Dereferences {@link Behavior#columns}, the subset of _active_ columns, specifying which column to show in that position. */
    activeColumnIndex: number;
    column: Column<BCS, SF>;
    /** Pixel coordinate of the left edge of this column, rounded to nearest integer. */
    left: number;
    /** Pixel coordinate of the right edge of this column + 1, rounded to nearest integer. */
    rightPlus1: number;
    /** Width of this column in pixels, rounded to nearest integer. */
    width: number;
}
