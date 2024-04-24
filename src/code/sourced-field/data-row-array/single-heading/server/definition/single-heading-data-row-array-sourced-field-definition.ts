// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Integer } from '@xilytix/sysutils';
import { HorizontalAlign } from '../../../../../standard/internal-api';
import { RevSourcedFieldDefinition, RevSourcedFieldSourceDefinition } from '../../../../sourced-field/server/internal-api';

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
        defaultTextAlign: HorizontalAlign,
        defaultWidth?: Integer,
        key?: string,
    ): RevSingleHeadingDataRowArraySourcedFieldDefinition {
        return {
            name: RevSourcedFieldDefinition.Name.compose(sourceDefinition.name, sourcelessName),
            sourceDefinition,
            sourcelessName,
            defaultHeading,
            defaultTextAlign,
            defaultWidth,
            key,
        };
    }
}
