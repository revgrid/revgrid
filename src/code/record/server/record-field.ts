import { RevDataServer, RevSchemaField } from '../../common';
import { RevRecord } from './record';

/** Provides access to a field
 * @public
 */
export interface RevRecordField extends RevSchemaField {
    readonly name: string;

    /** Set to true if field value depends on Record Index */
    valueDependsOnRecordIndex?: boolean;
    /** Set to true if field value depends on Row Index */
    valueDependsOnRowIndex?: boolean;

    /** Retrieves the value of a field for display purposes */
    getViewValue(record: RevRecord): RevDataServer.ViewValue;

    /** Retrieves the value of a field for edit purposes */
    getEditValue(record: RevRecord): RevDataServer.EditValue;

    /** Set the value of a field */
    setEditValue(record: RevRecord, value: RevDataServer.EditValue): void;

    /**
     * Compares two records based on this field for sorting in ascending order
     * @param left - The record on the left of the comparison
     * @param right - The record on the right of the comparison
     */
    compare?(left: RevRecord, right: RevRecord): number;

    /**
     * Compares two records based on this field for sorting in descending order
     * @param left - The record on the left of the comparison
     * @param right - The record on the right of the comparison
     * Can be undefined to disable sorting based on this field
     */
    compareDesc?(left: RevRecord, right: RevRecord): number;
}

/** @public */
export namespace RevRecordField {
    export type Comparer = (this: void, left: RevRecord, right: RevRecord) => number;
}

