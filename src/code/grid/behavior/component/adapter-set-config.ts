import { SubgridDefinition } from '../../components/subgrid/subgrid-definition';
import { SchemaServer } from '../../interfaces/server/schema-server';

/** @public */
export interface AdapterSetConfig {
    schemaServer: (SchemaServer | SchemaServer.Constructor),
    /** Pass in DataModel via subgrids. Recommend supply DataModel for main subgrid however ok to use LocalHeaderDataModel for header */
    subgrids: SubgridDefinition[],
}
