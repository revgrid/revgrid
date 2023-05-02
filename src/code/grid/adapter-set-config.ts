import { SubgridInterface } from './common/subgrid-interface';
import { CellModel } from './model/cell-model';
import { DataModel } from './model/data-model';
import { MetaModel } from './model/meta-model';
import { SchemaModel } from './model/schema-model';

/** @public */
export interface AdapterSetConfig {
    schemaModel: (SchemaModel | SchemaModel.Constructor),
    /** Pass in DataModel via subgrids. Recommend supply DataModel for main subgrid however ok to use LocalHeaderDataModel for header */
    subgrids: SubgridDefinition[],
}

/** @public */
export interface SubgridDefinition {
    role?: SubgridInterface.Role, // defaults to main
    dataModel: DataModel | DataModel.Constructor,
    cellModel: CellModel | CellModel.Constructor,
    metaModel?: MetaModel | MetaModel.Constructor,
    selectable?: boolean,
}
