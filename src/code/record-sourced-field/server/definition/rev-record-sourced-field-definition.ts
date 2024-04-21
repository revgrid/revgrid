// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer } from '@xilytix/sysutils';
import { RevSourcedFieldDefinition } from '../../../sourced-field/server/internal-api';
import { HorizontalAlign } from '../../../standard/standard-public-api';
import { RevRecordSourcedFieldSourceDefinition } from './rev-record-sourced-field-source-definition';

/** @public */
export class RevRecordSourcedFieldDefinition implements RevSourcedFieldDefinition {
    readonly name: string;

    constructor(
        readonly sourceDefinition: RevRecordSourcedFieldSourceDefinition,
        readonly sourcelessName: string,
        readonly defaultHeading: string,
        readonly defaultTextAlign: HorizontalAlign,
        readonly defaultWidth?: Integer,
    ) {
        this.name = RevSourcedFieldDefinition.Name.compose(sourceDefinition.name, sourcelessName);
    }
}
