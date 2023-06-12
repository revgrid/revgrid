import { Revgrid, SchemaServer } from '../grid/grid-public-api';
import { StandardInMemoryBehavioredColumnSettings, StandardInMemoryBehavioredGridSettings } from './settings-implementations/standard-settings-implementations-public-api';

/** @public */
export class StandardRevgrid extends Revgrid<
    StandardInMemoryBehavioredGridSettings,
    StandardInMemoryBehavioredColumnSettings,
    SchemaServer.Column<StandardInMemoryBehavioredColumnSettings>
> {
}
