import { DataModel } from '../../interfaces/data-model';
import { MetaModel } from '../../interfaces/meta-model';
import { SubgridInterface } from '../../interfaces/subgrid-interface';
import { CellPainter } from '../cell/cell-painter';
import { ViewCell } from '../cell/view-cell';

/** @public */
export interface SubgridDefinition {
    role?: SubgridInterface.Role; // defaults to main
    dataModel: DataModel | DataModel.Constructor;
    metaModel?: MetaModel | MetaModel.Constructor;
    getCellPainterEventer: SubgridDefinition.GetCellPainterEventer;
    selectable?: boolean;
    defaultRowHeight?: number;
    rowPropertiesCanSpecifyRowHeight?: boolean;
    rowPropertiesPrototype?: MetaModel.RowPropertiesPrototype;
}

/** @public */
export namespace SubgridDefinition {
    export type GetCellPainterEventer = (this: void, viewCell: ViewCell, prefillColor: string | undefined) => CellPainter;
}
