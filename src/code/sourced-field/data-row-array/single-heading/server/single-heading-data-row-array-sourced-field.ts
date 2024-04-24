// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevDataRowArrayField } from '../../../../data-row-array/server/internal-api';
import { SingleHeadingSchemaField } from '../../../../header/server/internal-api';
import { RevSourcedField } from '../../../sourced-field/server/internal-api';
import { RevSingleHeadingDataRowArraySourcedFieldDefinition } from './definition/internal-api';

/** @public */
export interface RevSingleHeadingDataRowArraySourcedField extends RevSourcedField, RevDataRowArrayField, SingleHeadingSchemaField {
}

/** @public */
export namespace RevSingleHeadingDataRowArraySourcedField {
    export function createFromDefinition(
        definition: RevSingleHeadingDataRowArraySourcedFieldDefinition,
        heading?: string
    ): RevSingleHeadingDataRowArraySourcedField {
        return {
            definition,
            name: definition.name,
            index: -1,
            heading: heading ?? definition.defaultHeading,
        };
    }
}
