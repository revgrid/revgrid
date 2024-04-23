// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevSourcedFieldSourceDefinition } from '../../../../sourced-field/server/internal-api';

/** @public */
export class RevSingleHeadingDataRowArraySourcedFieldSourceDefinition implements RevSourcedFieldSourceDefinition {
    constructor(readonly name: string) {

    }
}
