// (c) 2024 Xilytix Pty Ltd / Paul Klink

import {
    Integer
} from '@xilytix/sysutils';
import { RevDataRowArrayField } from '../../data-row-array/server/internal-api';
import { SingleHeadingSchemaField } from '../../header/server/public-api';
import { RevSourcedField } from '../../sourced-field/server/internal-api';
import { RevSingleHeadingDataRowArraySourcedFieldDefinition } from './definition/internal-api';

/** @public */
export class RevSingleHeadingDataRowArraySourcedField implements RevSourcedField, RevDataRowArrayField, SingleHeadingSchemaField {
    readonly name: string;
    index: Integer;
    heading: string;

    constructor(readonly definition: RevSingleHeadingDataRowArraySourcedFieldDefinition, heading?: string) {
        this.name = definition.name;
        this.heading = heading ?? definition.defaultHeading;
    }
}
