import { CellModel } from '../../components/subgrid/cell-model';
import { DataModel } from '../../interfaces/data-model';
import { MetaModel } from '../../interfaces/meta-model';
import { SchemaModel } from '../../interfaces/schema-model';
import { SubgridInterface } from '../../interfaces/subgrid-interface';

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
