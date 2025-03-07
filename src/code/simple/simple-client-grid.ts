import { RevClientGrid } from '../client/internal-api';
import { RevSchemaField } from '../common/internal-api';
import { RevSimpleInMemoryBehavioredColumnSettings, RevSimpleInMemoryBehavioredGridSettings } from './settings-implementations/internal-api';

/** @public */
export class RevSimpleClientGrid<SF extends RevSchemaField> extends RevClientGrid<
    RevSimpleInMemoryBehavioredGridSettings,
    RevSimpleInMemoryBehavioredColumnSettings,
    SF
> {
}
