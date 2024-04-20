// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer } from '@xilytix/sysutils';
import { RevColumnLayoutDefinition } from '../../column-layout/server/internal-api';
import { RevAllowedSourcedRecordField } from './rev-allowed-sourced-record-field';

/** @public */
export class RevAllowedSourcedRecordFieldsColumnLayoutDefinition<RenderValueTypeId, RenderAttributeTypeId> extends RevColumnLayoutDefinition {
    // Uses AllowedGridField instead of RevFieldDefinition as heading can be changed at runtime
    constructor(
        columns: readonly RevColumnLayoutDefinition.Column[],
        readonly allowedFields: readonly RevAllowedSourcedRecordField<RenderValueTypeId, RenderAttributeTypeId>[],
        readonly fixedColumnCount: Integer,
    ) {
        super(columns);
    }
}
