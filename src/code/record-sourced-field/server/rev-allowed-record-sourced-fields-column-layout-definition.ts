// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer } from '@xilytix/sysutils';
import { RevColumnLayoutDefinition } from '../../column-layout/server/internal-api';
import { RevAllowedSourcedFieldsColumnLayoutDefinition } from '../../sourced-field/server/internal-api';
import { RevAllowedRecordSourcedField } from './rev-allowed-record-sourced-field';

/** @public */
export class RevAllowedRecordSourcedFieldsColumnLayoutDefinition<RenderValueTypeId, RenderAttributeTypeId> extends RevColumnLayoutDefinition implements RevAllowedSourcedFieldsColumnLayoutDefinition {
    // Uses AllowedGridField instead of RevFieldDefinition as heading can be changed at runtime
    constructor(
        columns: readonly RevColumnLayoutDefinition.Column[],
        readonly allowedFields: readonly RevAllowedRecordSourcedField<RenderValueTypeId, RenderAttributeTypeId>[],
        readonly fixedColumnCount: Integer,
    ) {
        super(columns);
    }
}
