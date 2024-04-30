// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevColumnLayoutDefinition } from '../../../../../../column-layout/server/internal-api';
import { RevTableFieldSourceDefinition } from './table-field-source-definition';
import { RevTableFieldSourceDefinitionFactory } from './table-field-source-definition-factory';

/** @public */
export class RevTableFieldSourceDefinitionCachingFactoryService<TypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
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
