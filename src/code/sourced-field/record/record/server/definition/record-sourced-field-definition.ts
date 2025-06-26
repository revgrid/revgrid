import { Integer } from '@pbkware/js-utils';
import { RevHorizontalAlignId } from '../../../../../cell-content/client';
import { RevSourcedFieldDefinition } from '../../../../sourced-field/server';
import { RevRecordSourcedFieldSourceDefinition } from './record-sourced-field-source-definition';

/** @public */
export class RevRecordSourcedFieldDefinition implements RevSourcedFieldDefinition {
    readonly name: string;

    constructor(
        readonly sourceDefinition: RevRecordSourcedFieldSourceDefinition,
        readonly sourcelessName: string,
        readonly defaultHeading: string,
        readonly defaultTextAlignId: RevHorizontalAlignId,
        readonly defaultWidth?: Integer,
    ) {
        this.name = RevSourcedFieldDefinition.Name.compose(sourceDefinition.name, sourcelessName);
    }
}
