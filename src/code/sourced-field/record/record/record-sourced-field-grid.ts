import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../../../client';
import { RevRecordGrid } from '../../../record';
import { RevSourcedFieldGrid } from '../../sourced-field';
import { RevAllowedRecordSourcedField, RevAllowedRecordSourcedFieldsColumnLayoutDefinition, RevRecordSourcedField } from './server';

/** @public */
export class RevRecordSourcedFieldGrid<
    TextFormattableValueTypeId,
    TextFormattableValueAttributeTypeId,
    BGS extends RevBehavioredGridSettings,
    BCS extends RevBehavioredColumnSettings,
    SF extends RevRecordSourcedField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>
> extends RevRecordGrid<BGS, BCS, SF> implements RevSourcedFieldGrid<BGS, BCS, SF> {
    createAllowedSourcedFieldsColumnLayoutDefinition(allowedFields: readonly RevAllowedRecordSourcedField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[]) {
        const definitionColumns = this.createColumnLayoutDefinitionColumns();
        return new RevAllowedRecordSourcedFieldsColumnLayoutDefinition<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>(
            definitionColumns, allowedFields, this.settings.fixedColumnCount
        );
    }
}
