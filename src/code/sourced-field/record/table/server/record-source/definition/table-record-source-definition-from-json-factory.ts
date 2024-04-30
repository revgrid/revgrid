// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { JsonElement, Result } from '@xilytix/sysutils';
import { RevTableRecordSourceDefinition } from './table-record-source-definition';

/** @public */
export interface RevTableRecordSourceDefinitionFromJsonFactory<TypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
    tryCreateFromJson(element: JsonElement): Result<RevTableRecordSourceDefinition<TypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>>;
}
