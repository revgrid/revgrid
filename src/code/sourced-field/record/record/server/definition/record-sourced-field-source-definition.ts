import { RevSourcedFieldSourceDefinition } from '../../../../sourced-field/server';

/** @public */
export class RevRecordSourcedFieldSourceDefinition  implements RevSourcedFieldSourceDefinition {
    constructor(readonly name: string) {

    }
}
