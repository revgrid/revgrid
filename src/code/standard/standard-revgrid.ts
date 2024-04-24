import { RevClientGrid, SchemaField } from '../client/internal-api';
import { InMemoryStandardBehavioredColumnSettings, InMemoryStandardBehavioredGridSettings } from './settings-implementations/internal-api';

/** @public */
export class StandardRevgrid extends RevClientGrid<
    InMemoryStandardBehavioredGridSettings,
    InMemoryStandardBehavioredColumnSettings,
    SchemaField
> {
}
