import { RevColumnLayoutDefinition } from '../../../../../../column-layout/server/internal-api';
import { RevTableFieldSourceDefinition } from './table-field-source-definition';
import { RevTableFieldSourceDefinitionFactory } from './table-field-source-definition-factory';

/** @public */
export interface RevTableFieldSourceDefinitionCachingFactory<TypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
    readonly definitionFactory: RevTableFieldSourceDefinitionFactory<TypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;

    get(typeId: TypeId): RevTableFieldSourceDefinition<TypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;
    createLayoutDefinition(fieldIds: RevTableFieldSourceDefinition.FieldId<TypeId>[]): RevColumnLayoutDefinition;
}
