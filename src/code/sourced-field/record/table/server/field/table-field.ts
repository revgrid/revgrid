import {
    Integer,
    compareValue
} from '@pbkware/js-utils';
import { RevHorizontalAlignId, RevTextFormattableValue } from '../../../../../cell-content/client';
import { RevTextFormatter } from '../../../../../cell-content/server';
import { RevSourcedFieldSourceDefinition } from '../../../../sourced-field/server';
import { RevRecordSourcedField, RevRecordSourcedFieldDefinition } from '../../../record/server';
import { RevGenericTableValue, RevTableValue, RevTableValuesRecord } from '../value';

/** @public */
export abstract class RevTableField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> extends RevRecordSourcedField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
    private _valueTypeId: TextFormattableValueTypeId;

    constructor(
        protected readonly _textFormatter: RevTextFormatter<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
        definition: RevTableField.Definition<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
        heading: string,
    ) {
        super(definition, heading);
    }

    get valueTypeId() { return this._valueTypeId; }

    compare(left: RevTableValuesRecord<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>, right: RevTableValuesRecord<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>): number {
        const leftValue = left.values[this.index];
        const rightValue = right.values[this.index];
        if (leftValue === rightValue) {
            return 0;
        } else {
            if (leftValue.isUndefined()) {
                if (rightValue.isUndefined()) {
                    return 0;
                } else {
                    return this.compareUndefinedToDefinedField(rightValue);
                }
            } else {
                if (rightValue.isUndefined()) {
                    return -this.compareUndefinedToDefinedField(leftValue);
                } else {
                    return this.compareDefined(leftValue, rightValue);
                }
            }
        }
    }

    compareDesc(left: RevTableValuesRecord<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>, right: RevTableValuesRecord<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>): number {
        const leftValue = left.values[this.index];
        const rightValue = right.values[this.index];
        if (leftValue === rightValue) {
            return 0;
        } else {
            if (leftValue.isUndefined()) {
                if (rightValue.isUndefined()) {
                    return 0;
                } else {
                    return -this.compareUndefinedToDefinedField(rightValue);
                }
            } else {
                if (rightValue.isUndefined()) {
                    return this.compareUndefinedToDefinedField(leftValue);
                } else {
                    return this.compareDefined(rightValue, leftValue);
                }
            }
        }
    }

    override getViewValue(record: RevTableValuesRecord<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>): RevTextFormattableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
        const tableGridValue = record.values[this.index];
        return tableGridValue.textFormattableValue;
    }

    protected setValueTypeId(value: TextFormattableValueTypeId) {
        this._valueTypeId = value;
    }

    protected compareUndefinedToDefinedField(definedValue: RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>) {
        // left is undefined, right is defined (parameter)
        return -1;
    }

    protected abstract compareDefined(left: RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>, right: RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>): number;
}

/** @public */
export namespace RevTableField {
    export class Definition<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> extends RevRecordSourcedFieldDefinition {
        constructor(
            sourceDefinition: RevSourcedFieldSourceDefinition,
            sourcelessName: string,
            defaultHeading: string,
            defaultTextAlignId: RevHorizontalAlignId,
            readonly gridFieldConstructor: RevTableField.Constructor<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
            readonly gridValueConstructor: RevTableValue.Constructor<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,

        ) {
            super(sourceDefinition, sourcelessName, defaultHeading, defaultTextAlignId);
        }
    }

    export type Constructor<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> = new(
        textFormatter: RevTextFormatter<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
        definition: RevTableField.Definition<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
        heading: string,
        index: Integer,
    ) => RevTableField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>;
}

/** @public */
export class RevGenericTableField<
    TextFormattableValueTypeId,
    TextFormattableValueAttributeTypeId
> extends RevTableField<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {

    protected compareDefined(
        left: RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>,
        right: RevTableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>
    ): number {
        return compareValue<number | string>((left as RevGenericTableValue<number | string, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>).definedData, (right as RevGenericTableValue<number | string, TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>).definedData);
    }
}
