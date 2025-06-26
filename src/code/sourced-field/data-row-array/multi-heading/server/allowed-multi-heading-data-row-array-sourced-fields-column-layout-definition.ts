import { Integer } from '@pbkware/js-utils';
import { RevColumnLayoutDefinition } from '../../../../column-layout/server';
import { RevAllowedSourcedFieldsColumnLayoutDefinition } from '../../../sourced-field/server';
import { RevMultiHeadingDataRowArraySourcedField } from './multi-heading-data-row-array-sourced-field';

/** @public */
export class RevAllowedMultiHeadingDataRowArraySourcedFieldsColumnLayoutDefinition extends RevColumnLayoutDefinition implements RevAllowedSourcedFieldsColumnLayoutDefinition {
    constructor(
        columns: readonly RevColumnLayoutDefinition.Column[],
        readonly allowedFields: readonly RevMultiHeadingDataRowArraySourcedField[],
        readonly fixedColumnCount: Integer,
    ) {
        super(columns);
    }
}
