// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer } from '@xilytix/sysutils';
import { RevColumnLayoutDefinition } from '../../../../column-layout/server/internal-api';
import { RevAllowedSourcedFieldsColumnLayoutDefinition } from '../../../sourced-field/server/internal-api';
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
