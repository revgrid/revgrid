import { Guid, IndexedRecord } from '@pbkware/js-utils';

/** @public */
export class RevFavouriteReferenceableColumnLayoutDefinition implements IndexedRecord {
    name: string;
    id: Guid;
    index: number;
}
