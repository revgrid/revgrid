import { RevDataRowArrayField } from '../../../../data-row-array/server';
import { RevSingleHeadingField } from '../../../../header/server';
import { RevSourcedField } from '../../../sourced-field/server';
import { RevSingleHeadingDataRowArraySourcedFieldDefinition } from './definition';

/** @public */
export interface RevSingleHeadingDataRowArraySourcedField extends RevSourcedField, RevDataRowArrayField, RevSingleHeadingField {
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
