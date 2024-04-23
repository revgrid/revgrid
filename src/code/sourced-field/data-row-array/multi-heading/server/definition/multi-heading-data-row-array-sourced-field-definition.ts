// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer } from '@xilytix/sysutils';
import { HorizontalAlign } from '../../../../../standard/internal-api';
import { RevSourcedFieldDefinition } from '../../../../sourced-field/server/internal-api';
import { RevMultiHeadingDataRowArraySourcedFieldSourceDefinition } from './multi-heading-data-row-array-sourced-field-source-definition';

/** @public */
export class RevMultiHeadingDataRowArraySourcedFieldDefinition implements RevSourcedFieldDefinition {
    readonly name: string;
    readonly defaultHeading: string;

    constructor(
        readonly key: string,
        readonly headings: string[],
        readonly sourceDefinition: RevMultiHeadingDataRowArraySourcedFieldSourceDefinition,
        readonly sourcelessName: string,
        defaultHeading: string | undefined,
        readonly defaultTextAlign: HorizontalAlign,
        readonly defaultWidth?: Integer,
    ) {
        this.name = RevSourcedFieldDefinition.Name.compose(sourceDefinition.name, sourcelessName);
        if (defaultHeading === undefined) {
            this.defaultHeading = headings.join('/');
        } else {
            this.defaultHeading = defaultHeading;
        }
    }
}
