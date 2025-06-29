import {
    AssertInternalError,
    IndexedRecord,
    Integer
} from '@pbkware/js-utils';
import { RevTextFormattableValue } from '../../../../cell-content/client';
import { RevDataServer } from '../../../../common';
import { RevRecordField } from '../../../../record/server';
import { RevSourcedField } from '../../../sourced-field/server';
import { RevRecordSourcedFieldDefinition } from './definition';

/** @public */
export abstract class RevRecordSourcedField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> implements RevSourcedField, RevRecordField {
    getEditValueEventer: RevSourcedRecordField.GetEditValueEventer | undefined;
    setEditValueEventer: RevSourcedRecordField.SetEditValueEventer | undefined;

    readonly name: string;
    index: Integer;
    heading: string;

    constructor(readonly definition: RevRecordSourcedFieldDefinition, heading?: string) {
        this.name = definition.name;
        this.heading = heading ?? definition.defaultHeading;
    }

    getEditValue(record: IndexedRecord): RevDataServer.EditValue {
        if (this.getEditValueEventer === undefined) {
            throw new AssertInternalError('GFGEV20814');
        } else {
            return this.getEditValueEventer(record);
        }
    }

    setEditValue(record: IndexedRecord, value: RevDataServer.EditValue) {
        if (this.setEditValueEventer === undefined) {
            throw new AssertInternalError('GFSEV20814');
        } else {
            this.setEditValueEventer(record, value);
        }
    }

    abstract getViewValue(record: IndexedRecord): RevTextFormattableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;
}

/** @public */
export namespace RevSourcedRecordField {
    export type GetEditValueEventer = (this: void, record: IndexedRecord) => RevDataServer.EditValue;
    export type SetEditValueEventer = (this: void, record: IndexedRecord, value: RevDataServer.EditValue) => void;
}
