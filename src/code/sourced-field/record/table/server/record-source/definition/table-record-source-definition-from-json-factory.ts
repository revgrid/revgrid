import { JsonElement, Result } from '@pbkware/js-utils';
import { RevTableRecordSourceDefinition } from './table-record-source-definition';

/** @public */
export interface RevTableRecordSourceDefinitionFromJsonFactory<TypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
    tryCreateFromJson(element: JsonElement): Result<RevTableRecordSourceDefinition<TypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>>;
}
