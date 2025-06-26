import { LockItemByKeyList } from '@pbkware/js-utils';
import { RevReferenceableColumnLayoutDefinition } from './definition';
import { RevReferenceableColumnLayout } from './referenceable-column-layout';

/** @public */
export interface RevReferenceableColumnLayouts extends LockItemByKeyList<RevReferenceableColumnLayout> {
    getOrNew(definition: RevReferenceableColumnLayoutDefinition): RevReferenceableColumnLayout;
}
