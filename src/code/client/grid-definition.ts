import { RevSchemaField, RevSchemaServer } from '../common';
import { RevSubgrid } from './interfaces/subgrid';
import { RevBehavioredColumnSettings } from './settings';

/** @public */
export interface RevGridDefinition<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    schemaServer: (RevSchemaServer<SF> | RevSchemaServer.Constructor<SF>),
    subgrids: RevSubgrid.Definition<BCS, SF>[],
}
