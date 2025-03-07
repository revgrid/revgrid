// (c) 2024 Xilytix Pty Ltd / Paul Klink

import {
    Integer
} from '@pbkware/js-utils';
import { RevDataRowArrayField } from '../../../../data-row-array/server/internal-api';
import { RevMultiHeadingField } from '../../../../header/server/internal-api';
import { RevSourcedField } from '../../../sourced-field/server/internal-api';
import { RevMultiHeadingDataRowArraySourcedFieldDefinition } from './definition/internal-api';

/** @public */
export class RevMultiHeadingDataRowArraySourcedField implements RevSourcedField, RevDataRowArrayField, RevMultiHeadingField {
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
