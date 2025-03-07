import { RevSourcedFieldSourceDefinition } from '../../../../sourced-field/server/internal-api';

/** @public */
export class RevRecordSourcedFieldSourceDefinition  implements RevSourcedFieldSourceDefinition {
    constructor(readonly name: string) {

    }
}
