import { AssertInternalError, IndexedRecord } from '@pbkware/js-utils';
import { RevTextFormattableValue } from '../../../../cell-content/client/internal-api';
import { RevRecordSourcedField } from './record-sourced-field';

// AllowedGridField is used in Column selector
/** @public */
export class RevAllowedRecordSourcedField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> extends RevRecordSourcedField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
    override getViewValue(_record: IndexedRecord): RevTextFormattableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
        throw new AssertInternalError('AGFGVV34340'); // never used to get data
    }
}
