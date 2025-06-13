import { MapKey } from '@pbkware/js-utils';

/** @public */
export interface RevRecordDefinition {
    readonly mapKey: MapKey;
}

/** @public */
export namespace RevRecordDefinition {
    export function same(left: RevRecordDefinition, right: RevRecordDefinition) {
        return left.mapKey === right.mapKey;
    }
}
