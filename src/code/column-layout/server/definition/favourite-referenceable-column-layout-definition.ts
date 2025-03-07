// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { Guid, IndexedRecord } from '@pbkware/js-utils';

/** @public */
export class RevFavouriteReferenceableColumnLayoutDefinition implements IndexedRecord {
    name: string;
    id: Guid;
    index: number;
}
