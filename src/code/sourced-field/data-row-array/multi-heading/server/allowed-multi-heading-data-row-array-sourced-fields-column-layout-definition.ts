// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer } from '@xilytix/sysutils';
import { RevColumnLayoutDefinition } from '../../../../column-layout/server/internal-api';
import { RevAllowedSourcedFieldsColumnLayoutDefinition } from '../../../sourced-field/server/internal-api';
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
