import { Revgrid, SchemaField } from '../client/internal-api';
import { InMemoryStandardBehavioredColumnSettings, InMemoryStandardBehavioredGridSettings } from './settings-implementations/internal-api';

/** @public */
export class StandardRevgrid extends Revgrid<
    InMemoryStandardBehavioredGridSettings,
    InMemoryStandardBehavioredColumnSettings,
    SchemaField
> {
}
