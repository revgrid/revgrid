import { Subgrid } from '../../interfaces/data/subgrid';
import { SchemaServer } from '../../interfaces/schema/schema-server';
import { BehavioredColumnSettings } from '../../interfaces/settings/behaviored-column-settings';

/** @public */
export interface GridDefinition<BCS extends BehavioredColumnSettings> {
    schemaServer: (SchemaServer<BCS> | SchemaServer.Constructor<BCS>),
    subgrids: Subgrid.Definition<BCS>[],
}
