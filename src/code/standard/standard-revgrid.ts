import { Revgrid, SchemaField } from '../grid/grid-public-api';
import { StandardInMemoryBehavioredColumnSettings, StandardInMemoryBehavioredGridSettings } from './settings-implementations/standard-settings-implementations-public-api';

/** @public */
export class StandardRevgrid extends Revgrid<
    StandardInMemoryBehavioredGridSettings,
    StandardInMemoryBehavioredColumnSettings,
    SchemaField
> {
}
