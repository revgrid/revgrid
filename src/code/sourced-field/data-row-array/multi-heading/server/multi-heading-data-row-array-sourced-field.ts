// (c) 2024 Xilytix Pty Ltd / Paul Klink

import {
    Integer
} from '@xilytix/sysutils';
import { RevDataRowArrayField } from '../../../../data-row-array/server/internal-api';
import { RevMultiHeadingSchemaField } from '../../../../header/server/internal-api';
import { RevSourcedField } from '../../../sourced-field/server/internal-api';
import { RevMultiHeadingDataRowArraySourcedFieldDefinition } from './definition/internal-api';

/** @public */
export class RevMultiHeadingDataRowArraySourcedField implements RevSourcedField, RevDataRowArrayField, RevMultiHeadingSchemaField {
    readonly name: string;
    index: Integer;
    heading: string; // this is used in column selector
    headings: string[];

    constructor(readonly definition: RevMultiHeadingDataRowArraySourcedFieldDefinition, heading?: string, headings?: string[]) {
        this.name = definition.name;
        this.heading = heading ?? definition.defaultHeading;
        this.headings = headings ?? definition.headings;
    }
}
