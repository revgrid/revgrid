// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevBehavioredColumnSettings, RevBehavioredGridSettings } from '../../../client/internal-api';
import { RevRecordGrid } from '../../../record/internal-api';
import { RevSourcedFieldGrid } from '../../sourced-field/internal-api';
import { RevAllowedRecordSourcedField, RevAllowedRecordSourcedFieldsColumnLayoutDefinition, RevRecordSourcedField } from './server/internal-api';

/** @public */
export class RevRecordSourcedFieldGrid<
    RenderValueTypeId,
    RenderAttributeTypeId,
    BGS extends RevBehavioredGridSettings,
    BCS extends RevBehavioredColumnSettings,
    SF extends RevRecordSourcedField<RenderValueTypeId, RenderAttributeTypeId>
> extends RevRecordGrid<BGS, BCS, SF> implements RevSourcedFieldGrid<BGS, BCS, SF> {
    createAllowedSourcedFieldsColumnLayoutDefinition(allowedFields: readonly RevAllowedRecordSourcedField<RenderValueTypeId, RenderAttributeTypeId>[]) {
        const definitionColumns = this.createColumnLayoutDefinitionColumns();
        return new RevAllowedRecordSourcedFieldsColumnLayoutDefinition<RenderValueTypeId, RenderAttributeTypeId>(definitionColumns, allowedFields, this.settings.fixedColumnCount);
    }
}
