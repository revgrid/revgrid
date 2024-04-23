// (c) 2024 Xilytix Pty Ltd / Paul Klink

import {
    AssertInternalError,
    IndexedRecord,
    Integer
} from '@xilytix/sysutils';
import { DataServer } from '../../grid/internal-api';
import { RevRecordField } from '../../record/server/internal-api';
import { RevRenderValue } from '../../render-value/internal-api';
import { RevSourcedField } from '../../sourced-field/server/internal-api';
import { RevRecordSourcedFieldDefinition } from './definition/internal-api';

/** @public */
export abstract class RevRecordSourcedField<RenderValueTypeId, RenderAttributeTypeId> implements RevSourcedField, RevRecordField {
    getEditValueEventer: RevSourcedRecordField.GetEditValueEventer | undefined;
    setEditValueEventer: RevSourcedRecordField.SetEditValueEventer | undefined;

    readonly name: string;
    index: Integer;
    heading: string;

    constructor(readonly definition: RevRecordSourcedFieldDefinition, heading?: string) {
        this.name = definition.name;
        this.heading = heading ?? definition.defaultHeading;
    }

    getEditValue(record: IndexedRecord): DataServer.EditValue {
        if (this.getEditValueEventer === undefined) {
            throw new AssertInternalError('GFGEV20814');
        } else {
            return this.getEditValueEventer(record);
        }
    }

    setEditValue(record: IndexedRecord, value: DataServer.EditValue) {
        if (this.setEditValueEventer === undefined) {
            throw new AssertInternalError('GFSEV20814');
        } else {
            this.setEditValueEventer(record, value);
        }
    }

    abstract getViewValue(record: IndexedRecord): RevRenderValue<RenderValueTypeId, RenderAttributeTypeId>;
}

/** @public */
export namespace RevSourcedRecordField {
    export type GetEditValueEventer = (this: void, record: IndexedRecord) => DataServer.EditValue;
    export type SetEditValueEventer = (this: void, record: IndexedRecord, value: DataServer.EditValue) => void;
}
