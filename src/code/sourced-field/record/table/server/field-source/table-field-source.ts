// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer } from '@xilytix/sysutils';
import { RevTextFormatterService } from '../../../../../cell-content/server/internal-api';
import { RevSourcedField, RevSourcedFieldCustomHeadingsService } from '../../../../sourced-field/server/internal-api';
import { RevTableField } from '../field/internal-api';
import { RevTableFieldSourceDefinition } from './definition/internal-api';

/** @public */
export class RevTableFieldSource<TypeId, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
    fieldIndexOffset: Integer;
    nextFieldIndexOffset: Integer;

    constructor(
        private readonly _textFormatterService: RevTextFormatterService<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
        private readonly _customHeadingsService: RevSourcedFieldCustomHeadingsService | undefined,
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
            const heading = RevSourcedField.generateHeading(this._customHeadingsService, fieldDefinition);

            result[i] = new fieldDefinition.gridFieldConstructor(
                this._textFormatterService,
                fieldDefinition,
                heading,
                fieldIndexOffset + i,
            );
        }
        return result;
    }
}
