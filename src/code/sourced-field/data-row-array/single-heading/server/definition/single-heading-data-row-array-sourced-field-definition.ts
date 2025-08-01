import { Integer } from '@pbkware/js-utils';
import { RevHorizontalAlignId } from '../../../../../cell-content/client';
import { RevSourcedFieldDefinition, RevSourcedFieldSourceDefinition } from '../../../../sourced-field/server';

/** @public */
export interface RevSingleHeadingDataRowArraySourcedFieldDefinition extends RevSourcedFieldDefinition {
    readonly key?: string,
}

/** @public */
export namespace RevSingleHeadingDataRowArraySourcedFieldDefinition {
    export function create(
        sourceDefinition: RevSourcedFieldSourceDefinition,
        sourcelessName: string,
        defaultHeading: string,
        defaultTextAlignId: RevHorizontalAlignId,
        defaultWidth?: Integer,
        key?: string,
    ): RevSingleHeadingDataRowArraySourcedFieldDefinition {
        return {
            name: RevSourcedFieldDefinition.Name.compose(sourceDefinition.name, sourcelessName),
            sourceDefinition,
            sourcelessName,
            defaultHeading,
            defaultTextAlignId,
            defaultWidth,
            key,
        };
    }
}
