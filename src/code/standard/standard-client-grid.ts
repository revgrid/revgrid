import { RevClientGrid, RevSchemaField } from '../client/internal-api';
import { RevStandardInMemoryBehavioredColumnSettings, RevStandardInMemoryBehavioredGridSettings } from './settings-implementations/internal-api';

/** @public */
export class RevStandardClientGrid extends RevClientGrid<
    RevStandardInMemoryBehavioredGridSettings,
    RevStandardInMemoryBehavioredColumnSettings,
    RevSchemaField
> {
}
