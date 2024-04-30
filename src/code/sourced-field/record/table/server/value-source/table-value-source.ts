// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer, } from '@xilytix/sysutils';
import { RevRecordValueRecentChangeTypeId } from '../../../../../record/server/internal-api';
import { RevTableValue } from '../value/internal-api';

/** @public */
export abstract class RevTableValueSource<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
    valueChangesEvent: RevTableValueSource.ValueChangesEvent<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;
    allValuesChangeEvent: RevTableValueSource.AllValuesChangeEvent<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;
    becomeIncubatedEventer: RevTableValueSource.BecomeIncubatedEventer;

    protected _beenIncubated = false;

    constructor(private readonly _firstFieldIndexOffset: Integer ) { }

    get beenIncubated(): boolean { return this._beenIncubated; }
    get fieldCount() { return this.getfieldCount(); }
    get firstFieldIndexOffset() { return this._firstFieldIndexOffset; }

    protected notifyValueChangesEvent(valueChanges: RevTableValueSource.ValueChange<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[]) {
        for (let i = 0; i < valueChanges.length; i++) {
            valueChanges[i].fieldIndex += this._firstFieldIndexOffset;
        }
        this.valueChangesEvent(valueChanges);
    }

    protected notifyAllValuesChangeEvent(newValues: RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[]) {
        this.allValuesChangeEvent(this._firstFieldIndexOffset, newValues);
    }

    protected initialiseBeenIncubated(value: boolean) {
        this._beenIncubated = value;
    }

    protected processDataCorrectnessChanged(allValues: RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[], incubated: boolean) {
        this.allValuesChangeEvent(this._firstFieldIndexOffset, allValues);

        if (incubated) {
            this.checkNotifyBecameIncubated();
        }
    }

    private checkNotifyBecameIncubated() {
        if (!this._beenIncubated) {
            this._beenIncubated = true;
            this.becomeIncubatedEventer();
        }
    }

    abstract activate(): RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[];
    abstract deactivate(): void;
    abstract getAllValues(): RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[];

    protected abstract getfieldCount(): Integer;
}

/** @public */
export namespace RevTableValueSource {
    export interface ChangedValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
        fieldIdx: Integer;
        newValue: RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;
    }

    export interface ValueChange<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
        fieldIndex: Integer;
        newValue: RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;
        recentChangeTypeId: RevRecordValueRecentChangeTypeId | undefined;
    }
    export namespace ValueChange {
        export function arrayIncludesFieldIndex<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>(
            array: readonly ValueChange<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[],
            fieldIndex: Integer,
            end: Integer
        ): boolean {
            for (let i = 0; i < end; i++) {
                const valueChange = array[i];
                if (valueChange.fieldIndex === fieldIndex) {
                    return true;
                }
            }
            return false;
        }
    }

    export type BeginValuesChangeEvent = (this: void) => void;
    export type EndValuesChangeEvent = (this: void) => void;
    export type ValueChangesEvent<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> = (
        valueChanges: ValueChange<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[]
    ) => void;
    export type AllValuesChangeEvent<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> = (
        firstFieldIdxOffset: Integer,
        newValues: RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[]
    ) => void;
    export type BecomeIncubatedEventer = (this: void) => void;
    export type Constructor<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> = new(
        firstFieldIdxOffset: Integer,
        recordIdx: Integer
    ) => RevTableValueSource<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;
}
