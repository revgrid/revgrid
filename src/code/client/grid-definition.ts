// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevSchemaField, RevSchemaServer } from '../common/internal-api';
import { RevSubgrid } from './interfaces/subgrid';
import { RevBehavioredColumnSettings } from './settings/internal-api';

/** @public */
export interface RevGridDefinition<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> {
    schemaServer: (RevSchemaServer<SF> | RevSchemaServer.Constructor<SF>),
    subgrids: RevSubgrid.Definition<BCS, SF>[],
}
