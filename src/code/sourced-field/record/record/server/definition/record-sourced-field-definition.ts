// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer } from '@xilytix/sysutils';
import { RevHorizontalAlignId } from '../../../../../text/internal-api';
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
