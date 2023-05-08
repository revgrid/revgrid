import { SubgridDefinition } from '../../components/subgrid/subgrid-definition';
import { SchemaModel } from '../../interfaces/schema-model';

/** @public */
export interface AdapterSetConfig {
    schemaModel: (SchemaModel | SchemaModel.Constructor),
    /** Pass in DataModel via subgrids. Recommend supply DataModel for main subgrid however ok to use LocalHeaderDataModel for header */
    subgrids: SubgridDefinition[],
}
