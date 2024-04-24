import { Subgrid } from './interfaces/data/subgrid';
import { SchemaField } from './interfaces/schema/schema-field';
import { SchemaServer } from './interfaces/schema/schema-server';
import { BehavioredColumnSettings } from './interfaces/settings/behaviored-column-settings';

/** @public */
export interface RevGridDefinition<BCS extends BehavioredColumnSettings, SF extends SchemaField> {
    schemaServer: (SchemaServer<SF> | SchemaServer.Constructor<SF>),
    subgrids: Subgrid.Definition<BCS, SF>[],
}
