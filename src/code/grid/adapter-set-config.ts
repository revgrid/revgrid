import { CellModel } from './model/cell-model';
import { DataModel } from './model/data-model';
import { MetaModel } from './model/meta-model';
import { SchemaModel } from './model/schema-model';
import { Subgrid } from './subgrid/subgrid';

/** @public */
export interface AdapterSetConfig {
    schemaModel: (SchemaModel | SchemaModel.Constructor),
    /** Pass in DataModel via subgrids. Recommend supply DataModel for main subgrid however ok to use LocalHeaderDataModel for header */
    subgrids: SubgridDefinition[],
}

/** @public */
export interface SubgridDefinition {
    role?: Subgrid.Role, // defaults to main
    dataModel: DataModel | DataModel.Constructor,
    metaModel?: MetaModel | MetaModel.Constructor,
    cellModel?: CellModel | CellModel.Constructor,
    selectable?: boolean,
}
