// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { AssertInternalError, IndexedRecord } from '@xilytix/sysutils';
import { RevRenderValue } from '../../../../render-value/internal-api';
import { RevRecordSourcedField } from './record-sourced-field';

// AllowedGridField is used in Column selector
/** @public */
export class RevAllowedRecordSourcedField<RenderValueTypeId, RenderAttributeTypeId> extends RevRecordSourcedField<RenderValueTypeId, RenderAttributeTypeId> {
    override getViewValue(_record: IndexedRecord): RevRenderValue<RenderValueTypeId, RenderAttributeTypeId> {
        throw new AssertInternalError('AGFGVV34340'); // never used to get data
    }
}
