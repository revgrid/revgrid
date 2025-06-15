import { Integer } from '@pbkware/js-utils';
import { RevTextFormatter } from '../../../../../cell-content/server/internal-api';
import { RevSourcedField, RevSourcedFieldCustomHeadings } from '../../../../sourced-field/server/internal-api';
import { RevTableField } from '../field/internal-api';
import { RevTableFieldSourceDefinition } from './definition/internal-api';

/** @public */
export class RevTableFieldSource<TypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
    fieldIndexOffset: Integer;
    nextFieldIndexOffset: Integer;

    constructor(
        private readonly _textFormatter: RevTextFormatter<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
        private readonly _customHeadings: RevSourcedFieldCustomHeadings | undefined,
        public readonly definition: RevTableFieldSourceDefinition<TypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
        private _headingPrefix: string // This might be for call/put
    ) { }

    get name(): string { return this.definition.name; }
    get fieldCount(): Integer { return this.definition.fieldCount; }

    createTableFields(): RevTableField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>[] {
        const fieldCount = this.definition.fieldCount;
        const fieldIndexOffset = this.fieldIndexOffset;
        const fieldDefinitions = this.definition.fieldDefinitions;
        const result = new Array<RevTableField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>>(fieldCount);
        for (let i = 0; i < fieldCount; i++) {
            const fieldDefinition = fieldDefinitions[i];
            const heading = RevSourcedField.generateHeading(this._customHeadings, fieldDefinition);

            result[i] = new fieldDefinition.gridFieldConstructor(
                this._textFormatter,
                fieldDefinition,
                heading,
                fieldIndexOffset + i,
            );
        }
        return result;
    }
}
