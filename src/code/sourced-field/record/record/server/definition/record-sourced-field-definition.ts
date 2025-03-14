import { Integer } from '@pbkware/js-utils';
import { RevHorizontalAlignId } from '../../../../../cell-content/client/internal-api';
import { RevSourcedFieldDefinition } from '../../../../sourced-field/server/internal-api';
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
