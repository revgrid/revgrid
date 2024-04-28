// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer } from '@xilytix/sysutils';
import { RevHorizontalAlign } from '../../../../../text/internal-api';
import { RevSourcedFieldDefinition, RevSourcedFieldSourceDefinition } from '../../../../sourced-field/server/internal-api';

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
        defaultTextAlign: RevHorizontalAlign,
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
            defaultTextAlign,
            defaultWidth,
            key,
        };
    }

}
