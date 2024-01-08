import { Revgrid, SchemaField } from '../grid/grid-public-api';
import { InMemoryStandardBehavioredColumnSettings, InMemoryStandardBehavioredGridSettings } from './settings-implementations/standard-settings-implementations-public-api';

/** @public */
export class StandardRevgrid extends Revgrid<
    InMemoryStandardBehavioredGridSettings,
    InMemoryStandardBehavioredColumnSettings,
    SchemaField
> {
}
