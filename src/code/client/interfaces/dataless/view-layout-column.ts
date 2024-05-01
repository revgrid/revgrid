import { Integer } from '@xilytix/sysutils';
import { RevBehavioredColumnSettings } from '../../settings/internal-api';
import { RevSchemaField } from '../schema/schema-field';
import { RevColumn } from './column';

/** @public */
export interface RevViewLayoutColumn<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    /** A back reference to the element's array index in {@link ViewLayout#columns}. */
    index: Integer;
    /** Dereferences {@link Behavior#columns}, the subset of _active_ columns, specifying which column to show in that position. */
    activeColumnIndex: Integer;
    column: RevColumn<BCS, SF>;
    /** Pixel coordinate of the left edge of this column, rounded to nearest integer. */
    left: Integer;
    /** Pixel coordinate of the right edge of this column + 1, rounded to nearest integer. */
    rightPlus1: Integer;
    /** Width of this column in pixels, rounded to nearest integer. */
    width: Integer;
}
