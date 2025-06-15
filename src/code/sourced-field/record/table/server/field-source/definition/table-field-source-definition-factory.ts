import { RevTableFieldSourceDefinition } from './table-field-source-definition';

/** @public */
export interface RevTableFieldSourceDefinitionFactory<TypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
    create(typeId: TypeId): RevTableFieldSourceDefinition<TypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;
    tryNameToId(name: string): TypeId | undefined;
}
