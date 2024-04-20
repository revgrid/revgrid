// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { BehavioredColumnSettings, BehavioredGridSettings } from '../grid/grid-public-api';
import { RevRecordGrid } from '../record/internal-api';
import { RevAllowedSourcedRecordField, RevAllowedSourcedRecordFieldsColumnLayoutDefinition, RevSourcedRecordField } from './server/internal-api';

/** @public */
export class RevSourcedRecordFieldGrid<
    RenderValueTypeId,
    RenderAttributeTypeId,
    BGS extends BehavioredGridSettings,
    BCS extends BehavioredColumnSettings,
    SF extends RevSourcedRecordField<RenderValueTypeId, RenderAttributeTypeId>
> extends RevRecordGrid<BGS, BCS, SF> {
    createAllowedSourcedFieldsColumnLayoutDefinition(allowedFields: readonly RevAllowedSourcedRecordField<RenderValueTypeId, RenderAttributeTypeId>[]) {
        const definitionColumns = this.createColumnLayoutDefinitionColumns();
        return new RevAllowedSourcedRecordFieldsColumnLayoutDefinition<RenderValueTypeId, RenderAttributeTypeId>(definitionColumns, allowedFields, this.settings.fixedColumnCount);
    }
}
