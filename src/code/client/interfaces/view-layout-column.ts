import { Integer } from '@pbkware/js-utils';
import { RevSchemaField } from '../../common';
import { RevBehavioredColumnSettings } from '../settings/internal-api';
import { RevColumn } from './column';

/** @public */
export interface RevViewLayoutColumn<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    /** A back reference to the element's array index in {@link RevViewLayout#columns}. */
    index: Integer;
    /** Active index of column */
    activeColumnIndex: Integer;
    column: RevColumn<BCS, SF>;
    /** Pixel coordinate of the left edge of this column, rounded to nearest integer. */
    left: Integer;
    /** Pixel coordinate of the right edge of this column + 1, rounded to nearest integer. */
    rightPlus1: Integer;
    /** Width of this column in pixels, rounded to nearest integer. */
    width: Integer;
}
