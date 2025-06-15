import { RevClientGrid } from '../client';
import { RevSchemaField } from '../common';
import { RevSimpleInMemoryBehavioredColumnSettings, RevSimpleInMemoryBehavioredGridSettings } from './settings-implementations/internal-api';

/** @public */
export class RevSimpleClientGrid<SF extends RevSchemaField> extends RevClientGrid<
    RevSimpleInMemoryBehavioredGridSettings,
    RevSimpleInMemoryBehavioredColumnSettings,
    SF
> {
}
