import { Subgrid } from '../../interfaces/data/subgrid';
import { SchemaServer } from '../../interfaces/schema/schema-server';

/** @public */
export interface GridDefinition {
    schemaServer: (SchemaServer | SchemaServer.Constructor),
    subgrids: Subgrid.Definition[],
}
