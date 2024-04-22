// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer } from '@xilytix/sysutils';
import { RevSourcedFieldDefinition } from '../../../sourced-field/server/internal-api';
import { HorizontalAlign } from '../../../standard/standard-public-api';
import { RevSingleHeadingDataRowArraySourcedFieldSourceDefinition } from './single-heading-data-row-array-sourced-field-source-definition';

/** @public */
export class RevSingleHeadingDataRowArraySourcedFieldDefinition implements RevSourcedFieldDefinition {
    readonly name: string;

    constructor(
        readonly key: string,
        readonly sourceDefinition: RevSingleHeadingDataRowArraySourcedFieldSourceDefinition,
        readonly sourcelessName: string,
        readonly defaultHeading: string,
        readonly defaultTextAlign: HorizontalAlign,
        readonly defaultWidth?: Integer,
    ) {
        this.name = RevSourcedFieldDefinition.Name.compose(sourceDefinition.name, sourcelessName);
    }
}
