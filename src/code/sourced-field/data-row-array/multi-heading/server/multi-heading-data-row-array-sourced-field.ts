import {
    Integer
} from '@pbkware/js-utils';
import { RevDataRowArrayField } from '../../../../data-row-array/server';
import { RevMultiHeadingField } from '../../../../header/server';
import { RevSourcedField } from '../../../sourced-field/server';
import { RevMultiHeadingDataRowArraySourcedFieldDefinition } from './definition';

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
