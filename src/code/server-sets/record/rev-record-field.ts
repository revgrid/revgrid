import { BehavioredColumnSettings, DataServer, SchemaServer } from '../../grid/grid-public-api';
import { RevRecord } from './rev-record';

/** Provides access to a field
 * @public
 */
export interface RevRecordField<BCS extends BehavioredColumnSettings> {
    readonly name: string;
    /**
     * Retrieves the value of a field for display purposes
     * @param record - The record to compare to
     */
    getValue(record: RevRecord): DataServer.ViewValue;

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

    /** Set to true if field value depends on Record Index */
    valueDependsOnRecordIndex?: boolean;
    /** Set to true if field value depends on Row Index */
    valueDependsOnRowIndex?: boolean;

    /** Column Settings used by grid and cell painters/editors */
    columnSettings: BCS;
}

/** @public */
export namespace RevRecordField {
    export interface SchemaColumn<BCS extends BehavioredColumnSettings> extends SchemaServer.Column<BCS> {
        field: RevRecordField<BCS>;
    }

    export type Comparer = (this: void, left: RevRecord, right: RevRecord) => number;
}

