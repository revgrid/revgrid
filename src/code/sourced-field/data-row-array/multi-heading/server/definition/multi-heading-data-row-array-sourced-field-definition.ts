import { Integer } from '@pbkware/js-utils';
import { RevHorizontalAlignId } from '../../../../../cell-content/client';
import { RevSourcedFieldDefinition, RevSourcedFieldSourceDefinition } from '../../../../sourced-field/server';

/** @public */
export interface RevMultiHeadingDataRowArraySourcedFieldDefinition extends RevSourcedFieldDefinition {
    readonly headings: string[],
    readonly key?: string,
}

/** @public */
export namespace RevMultiHeadingDataRowArraySourcedFieldDefinition {
    export function create(
        sourceDefinition: RevSourcedFieldSourceDefinition,
        sourcelessName: string,
        headings: string[],
        defaultHeading: string | undefined,
        defaultTextAlignId: RevHorizontalAlignId,
        defaultWidth?: Integer,
        key?: string,
    ): RevMultiHeadingDataRowArraySourcedFieldDefinition {
        const resolvedDefaultHeading = defaultHeading === undefined ? headings.join('/') : defaultHeading;

        return {
            name: RevSourcedFieldDefinition.Name.compose(sourceDefinition.name, sourcelessName),
            sourceDefinition,
            sourcelessName,
            headings,
            defaultHeading: resolvedDefaultHeading,
            defaultTextAlignId,
            defaultWidth,
            key,
        };
    }

}
