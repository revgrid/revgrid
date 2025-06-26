import { Integer } from '@pbkware/js-utils';
import { RevColumnLayoutDefinition } from '../../../../column-layout/server';
import { RevAllowedSourcedFieldsColumnLayoutDefinition } from '../../../sourced-field/server';
import { RevAllowedRecordSourcedField } from './allowed-record-sourced-field';

/** @public */
export class RevAllowedRecordSourcedFieldsColumnLayoutDefinition<
    TextFormattableValueTypeId,
    TextFormattableValueAttributeTypeId
> extends RevColumnLayoutDefinition implements RevAllowedSourcedFieldsColumnLayoutDefinition {
    // Uses AllowedGridField instead of RevFieldDefinition as heading can be changed at runtime
    constructor(
        columns: readonly RevColumnLayoutDefinition.Column[],
        readonly allowedFields: readonly RevAllowedRecordSourcedField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[],
        readonly fixedColumnCount: Integer,
    ) {
        super(columns);
    }
}
