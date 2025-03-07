import { RevTableValue } from './table-value';

/** @public */
export abstract class RevGenericTableValue<T, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> extends RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
    private _data: T | undefined;
    private _definedData: T;

    get definedData() { return this._definedData; }

    get data() { return this._data; }
    set data(value: T | undefined) {
        this._data = value;
        if (value !== undefined) {
            this._definedData = value;
        }
    }

    isUndefined() {
        return this._data === undefined;
    }

    clear() {
        this._data = undefined;
    }
}
