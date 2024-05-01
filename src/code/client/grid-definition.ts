import { RevSubgrid } from './interfaces/data/subgrid';
import { RevSchemaField } from './interfaces/schema/schema-field';
import { RevSchemaServer } from './interfaces/schema/schema-server';
import { RevBehavioredColumnSettings } from './settings/internal-api';

/** @public */
export interface RevGridDefinition<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    schemaServer: (RevSchemaServer<SF> | RevSchemaServer.Constructor<SF>),
    subgrids: RevSubgrid.Definition<BCS, SF>[],
}
