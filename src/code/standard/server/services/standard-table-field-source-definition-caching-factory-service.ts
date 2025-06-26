import { RevColumnLayoutDefinition } from '../../../column-layout/server';
import { RevTableFieldSourceDefinition, RevTableFieldSourceDefinitionFactory } from '../../../sourced-field/record/table/server';

/** @public */
export class RevStandardTableFieldSourceDefinitionCachingFactoryService<TypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
    private readonly _definitionsByTypeId = new Map<TypeId, RevTableFieldSourceDefinition<TypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>>();
    private readonly _definitionsByName = new Map<string, RevTableFieldSourceDefinition<TypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>>();

    constructor(readonly definitionFactory: RevTableFieldSourceDefinitionFactory<TypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>) {

    }

    get(typeId: TypeId): RevTableFieldSourceDefinition<TypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
        let definition = this._definitionsByTypeId.get(typeId);
        if (definition === undefined) {
            definition = this.definitionFactory.create(typeId);
            this._definitionsByTypeId.set(typeId, definition);
        }
        return definition;
    }

    createLayoutDefinition(fieldIds: RevTableFieldSourceDefinition.FieldId<TypeId>[]): RevColumnLayoutDefinition {
        const count = fieldIds.length;
        const fieldNames = new Array<string>(count);
        for (let i = 0; i < count; i++) {
            const fieldId = fieldIds[i];
            const fieldName = this.get(fieldId.sourceTypeId).getFieldNameById(fieldId.id);
            fieldNames[i] = fieldName;
        }

        return RevColumnLayoutDefinition.createFromFieldNames(fieldNames);
    }
}
