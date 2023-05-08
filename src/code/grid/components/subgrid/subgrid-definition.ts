import { CellModel } from '../../components/cell/cell-model';
import { DataModel } from '../../interfaces/data-model';
import { MetaModel } from '../../interfaces/meta-model';
import { SubgridInterface } from '../../interfaces/subgrid-interface';

/** @public */
export interface SubgridDefinition {
    role?: SubgridInterface.Role, // defaults to main
    dataModel: DataModel | DataModel.Constructor,
    cellModel: CellModel | CellModel.Constructor,
    metaModel?: MetaModel | MetaModel.Constructor,
    selectable?: boolean,
}
