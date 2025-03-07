// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer } from '@pbkware/js-utils';
import { RevColumnLayoutDefinition } from '../../../column-layout/server/internal-api';
import { RevSourcedField } from './sourced-field';

/** @public */
export interface RevAllowedSourcedFieldsColumnLayoutDefinition {
    readonly allowedFields: readonly RevSourcedField[],
    readonly columns: readonly RevColumnLayoutDefinition.Column[],
    readonly columnCount: Integer;
    readonly fixedColumnCount: Integer,
}
