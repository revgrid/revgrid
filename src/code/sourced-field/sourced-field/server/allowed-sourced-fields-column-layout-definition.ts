import { Integer } from '@pbkware/js-utils';
import { RevColumnLayoutDefinition } from '../../../column-layout/server';
import { RevSourcedField } from './sourced-field';

/** @public */
export interface RevAllowedSourcedFieldsColumnLayoutDefinition {
    readonly allowedFields: readonly RevSourcedField[],
    readonly columns: readonly RevColumnLayoutDefinition.Column[],
    readonly columnCount: Integer;
    readonly fixedColumnCount: Integer,
}
