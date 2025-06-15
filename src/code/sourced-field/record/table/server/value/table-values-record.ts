import { IndexedRecord, Integer } from '@pbkware/js-utils';
import { RevTableValue } from './table-value';

/** @public */
export class RevTableValuesRecord<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> implements IndexedRecord {
    protected _values: RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[];

    constructor(public index: Integer) {
        // no code
    }

    get values(): readonly RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[] { return this._values; }
}
