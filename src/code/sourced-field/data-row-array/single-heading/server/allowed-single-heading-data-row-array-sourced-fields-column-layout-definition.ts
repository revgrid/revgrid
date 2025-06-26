import { Integer } from '@pbkware/js-utils';
import { RevColumnLayoutDefinition } from '../../../../column-layout/server';
import { RevAllowedSourcedFieldsColumnLayoutDefinition } from '../../../sourced-field/server';
import { RevSingleHeadingDataRowArraySourcedField } from './single-heading-data-row-array-sourced-field';

/** @public */
export class RevAllowedSingleHeadingDataRowArraySourcedFieldsColumnLayoutDefinition extends RevColumnLayoutDefinition implements RevAllowedSourcedFieldsColumnLayoutDefinition {
    constructor(
        columns: readonly RevColumnLayoutDefinition.Column[],
        readonly allowedFields: readonly RevSingleHeadingDataRowArraySourcedField[],
        readonly fixedColumnCount: Integer,
    ) {
        super(columns);
    }
}
