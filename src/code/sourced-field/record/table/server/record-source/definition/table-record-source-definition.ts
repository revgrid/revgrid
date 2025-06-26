import { JsonElement, Result } from '@pbkware/js-utils';
import { RevColumnLayoutDefinition } from '../../../../../../column-layout/server';
import { RevSourcedField, RevSourcedFieldCustomHeadings } from '../../../../../sourced-field/server';
import { RevAllowedRecordSourcedField } from '../../../../record/server';
import { RevTableFieldSourceDefinitionCachingFactory } from '../../field-source';

/** @public */
export abstract class RevTableRecordSourceDefinition<TypeId, TableFieldSourceDefinitionTypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
    constructor(
        readonly customHeadings: RevSourcedFieldCustomHeadings | undefined,
        readonly tableFieldSourceDefinitionCachingFactory: RevTableFieldSourceDefinitionCachingFactory<
            TableFieldSourceDefinitionTypeId,
            TextFormattableValueTypeId,
            TextFormattableValueAttributeTypeId
        >,
        readonly typeId: TypeId,
        readonly name: string,
        readonly allowedFieldSourceDefinitionTypeIds: readonly TableFieldSourceDefinitionTypeId[],
    ) {
    }

    createAllowedFields(): readonly RevAllowedRecordSourcedField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[] {
        const tableFieldSourceDefinitionCachingFactory = this.tableFieldSourceDefinitionCachingFactory;
        const customHeadings = this.customHeadings;
        let result: RevAllowedRecordSourcedField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[] = [];
        for (const allowedFieldSourceDefinitionTypeId of this.allowedFieldSourceDefinitionTypeIds) {
            const fieldSourceDefinition = tableFieldSourceDefinitionCachingFactory.get(allowedFieldSourceDefinitionTypeId);
            const fieldCount = fieldSourceDefinition.fieldCount;
            const fieldDefinitions = fieldSourceDefinition.fieldDefinitions;
            const sourceAllowedFields = new Array<RevAllowedRecordSourcedField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>>(fieldCount);
            for (let i = 0; i < fieldCount; i++) {
                const fieldDefinition = fieldDefinitions[i];
                const heading = RevSourcedField.generateHeading(customHeadings, fieldDefinition);

                sourceAllowedFields[i] = new RevAllowedRecordSourcedField(
                    fieldDefinition,
                    heading,
                );
            }
            result = [...result, ...sourceAllowedFields];
        }
        return result;
    }

    // createLayoutDefinition(fieldIds: TableFieldSourceDefinition.FieldId[]): ColumnLayoutDefinition {
    //     const fieldSourceDefinitionRegistryService = this.fieldSourceDefinitionRegistryService;
    //     const count = fieldIds.length;
    //     const fieldNames = new Array<string>(count);
    //     for (let i = 0; i < count; i++) {
    //         const fieldId = fieldIds[i];
    //         const fieldSourceDefinition = fieldSourceDefinitionRegistryService.get(fieldId.sourceTypeId);
    //         const fieldName = fieldSourceDefinition.getFieldNameById(fieldId.id);
    //         fieldNames[i] = fieldName;
    //     }

    //     return ColumnLayoutDefinition.createFromFieldNames(fieldNames);
    // }


    saveToJson(element: JsonElement) { // virtual;
        element.setString(RevTableRecordSourceDefinition.jsonTag_TypeId, this.name);
    }

    abstract createDefaultLayoutDefinition(): RevColumnLayoutDefinition;
}

/** @public */
export namespace RevTableRecordSourceDefinition {
    export const jsonTag_TypeId = 'recordSourceDefinitionTypeId';

    export function tryGetTypeIdNameFromJson(element: JsonElement): Result<string, JsonElement.ErrorId.JsonValueIsNotDefined | JsonElement.ErrorId.JsonValueIsNotOfTypeString> {
        return element.tryGetString(jsonTag_TypeId);
    }
}
